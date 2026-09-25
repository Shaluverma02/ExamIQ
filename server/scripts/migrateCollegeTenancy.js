const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const College = require('../models/College');
const Membership = require('../models/Membership');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Group = require('../models/Group');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Result = require('../models/Result');
const Certificate = require('../models/Certificate');
const ExamAssignment = require('../models/ExamAssignment');
const CodingSubmission = require('../models/CodingSubmission');
const CodingSession = require('../models/CodingSession');
const InterviewAttempt = require('../models/InterviewAttempt');
const VersantSubmission = require('../models/VersantSubmission');
const Category = require('../models/Category');
const Course = require('../models/Course');
const FormSchema = require('../models/FormSchema');
const AuditLog = require('../models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_exam_db';
const DEFAULT_COLLEGE_NAME = process.env.DEFAULT_COLLEGE_NAME || process.env.SEED_COLLEGE_NAME || 'Primary Institution';

const counters = {};
const bump = (key, value = 1) => {
  counters[key] = (counters[key] || 0) + value;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const makeCode = (name) => {
  const base = String(name || DEFAULT_COLLEGE_NAME)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || 'COLLEGE';
  return base;
};

const getOrCreateCollege = async (name) => {
  const cleanName = String(name || DEFAULT_COLLEGE_NAME).trim() || DEFAULT_COLLEGE_NAME;
  const existing = await College.findOne({ name: new RegExp(`^${escapeRegex(cleanName)}$`, 'i') });
  if (existing) return existing;

  const baseCode = makeCode(cleanName);
  let code = baseCode;
  let suffix = 1;
  while (await College.exists({ code })) {
    code = `${baseCode.slice(0, Math.max(1, 10 - String(suffix).length))}${suffix}`;
    suffix += 1;
  }

  const college = await College.create({
    name: cleanName,
    code,
    isActive: true,
    settings: {
      allowSelfRegistration: true,
      requireInviteCode: false,
    },
  });
  bump('collegesCreated');
  return college;
};

const ensureMembership = async (userId, collegeId, role) => {
  if (!userId || !collegeId) return;
  await Membership.findOneAndUpdate(
    { userId, collegeId },
    { userId, collegeId, role, status: 'active' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await User.findByIdAndUpdate(userId, {
    $addToSet: { collegeIds: collegeId },
    $set: { activeCollegeId: collegeId },
  });
  bump('membershipsEnsured');
};

const firstCollegeForUser = async (userId, fallbackCollegeId) => {
  if (!userId) return fallbackCollegeId;
  const user = await User.findById(userId).select('activeCollegeId collegeIds');
  return user?.activeCollegeId || user?.collegeIds?.[0] || fallbackCollegeId;
};

const updateDocumentCollege = async (doc, collegeId, key) => {
  if (!doc || doc.collegeId || !collegeId) return;
  doc.collegeId = collegeId;
  await doc.save();
  bump(key);
};

const dropIndexIfExists = async (Model, indexName) => {
  try {
    await Model.collection.dropIndex(indexName);
    bump(`droppedIndex:${Model.collection.name}.${indexName}`);
  } catch (err) {
    if (err.codeName !== 'IndexNotFound' && err.code !== 27) {
      console.warn(`Could not drop index ${Model.collection.name}.${indexName}: ${err.message}`);
    }
  }
};

const migrate = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for college tenancy migration.');

  const defaultCollege = await getOrCreateCollege(DEFAULT_COLLEGE_NAME);

  await dropIndexIfExists(Category, 'name_1');
  await dropIndexIfExists(Course, 'code_1');
  await dropIndexIfExists(FormSchema, 'formType_1');

  const students = await Student.find({}).lean(false);
  for (const student of students) {
    const college = await getOrCreateCollege(student.college || DEFAULT_COLLEGE_NAME);
    await updateDocumentCollege(student, college._id, 'studentsBackfilled');
    await ensureMembership(student.userId, college._id, 'student');
  }

  const faculties = await Faculty.find({}).lean(false);
  for (const faculty of faculties) {
    const collegeId = faculty.collegeId || defaultCollege._id;
    await updateDocumentCollege(faculty, collegeId, 'facultiesBackfilled');
    await ensureMembership(faculty.userId, collegeId, 'faculty');
  }

  const users = await User.find({ $or: [{ collegeIds: { $exists: false } }, { collegeIds: { $size: 0 } }, { activeCollegeId: { $exists: false } }, { activeCollegeId: null }] });
  for (const user of users) {
    const role = ['admin', 'faculty', 'student'].includes(user.role) ? user.role : 'student';
    await ensureMembership(user._id, defaultCollege._id, role);
  }

  const groups = await Group.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] });
  for (const group of groups) {
    const college = await getOrCreateCollege(group.college || DEFAULT_COLLEGE_NAME);
    group.collegeId = college._id;
    if (!group.college) group.college = college.name;
    await group.save();
    bump('groupsBackfilled');
  }

  const questions = await Question.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] });
  for (const question of questions) {
    await updateDocumentCollege(question, await firstCollegeForUser(question.createdBy, defaultCollege._id), 'questionsBackfilled');
  }

  const codingProblems = await CodingProblem.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] });
  for (const problem of codingProblems) {
    await updateDocumentCollege(problem, await firstCollegeForUser(problem.createdBy, defaultCollege._id), 'codingProblemsBackfilled');
  }

  const exams = await Exam.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] });
  for (const exam of exams) {
    await updateDocumentCollege(exam, await firstCollegeForUser(exam.facultyId, defaultCollege._id), 'examsBackfilled');
  }

  const examCollegeCache = new Map();
  const problemCollegeCache = new Map();
  const getExamCollegeId = async (examId) => {
    if (!examId) return defaultCollege._id;
    const key = examId.toString();
    if (!examCollegeCache.has(key)) {
      const exam = await Exam.findById(examId).select('collegeId facultyId');
      examCollegeCache.set(key, exam?.collegeId || await firstCollegeForUser(exam?.facultyId, defaultCollege._id));
    }
    return examCollegeCache.get(key) || defaultCollege._id;
  };
  const getProblemCollegeId = async (problemId) => {
    if (!problemId) return defaultCollege._id;
    const key = problemId.toString();
    if (!problemCollegeCache.has(key)) {
      const problem = await CodingProblem.findById(problemId).select('collegeId createdBy');
      problemCollegeCache.set(key, problem?.collegeId || await firstCollegeForUser(problem?.createdBy, defaultCollege._id));
    }
    return problemCollegeCache.get(key) || defaultCollege._id;
  };

  for (const attempt of await ExamAttempt.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })) {
    await updateDocumentCollege(attempt, await getExamCollegeId(attempt.examId), 'examAttemptsBackfilled');
  }
  for (const result of await Result.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })) {
    await updateDocumentCollege(result, await getExamCollegeId(result.examId), 'resultsBackfilled');
  }
  for (const certificate of await Certificate.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })) {
    await updateDocumentCollege(certificate, await getExamCollegeId(certificate.examId), 'certificatesBackfilled');
  }
  for (const assignment of await ExamAssignment.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })) {
    await updateDocumentCollege(assignment, await getExamCollegeId(assignment.examId), 'examAssignmentsBackfilled');
  }
  for (const submission of await CodingSubmission.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })) {
    await updateDocumentCollege(submission, await getProblemCollegeId(submission.problemId), 'codingSubmissionsBackfilled');
  }
  for (const session of await CodingSession.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })) {
    await updateDocumentCollege(session, await getProblemCollegeId(session.problemId), 'codingSessionsBackfilled');
  }
  for (const attempt of await InterviewAttempt.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })) {
    await updateDocumentCollege(attempt, await firstCollegeForUser(attempt.studentId, defaultCollege._id), 'interviewAttemptsBackfilled');
  }
  for (const submission of await VersantSubmission.find({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })) {
    await updateDocumentCollege(submission, await firstCollegeForUser(submission.studentId, defaultCollege._id), 'versantSubmissionsBackfilled');
  }

  await Category.updateMany({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }, { $set: { collegeId: defaultCollege._id } });
  await Course.updateMany({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }, { $set: { collegeId: defaultCollege._id } });
  await FormSchema.updateMany({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }, { $set: { collegeId: defaultCollege._id } });
  await AuditLog.updateMany({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }, { $set: { collegeId: defaultCollege._id } });

  await mongoose.disconnect();
  console.log('College tenancy migration completed.');
  console.table(counters);
};

migrate().catch(async (err) => {
  console.error('College tenancy migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
