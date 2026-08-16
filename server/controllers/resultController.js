const mongoose = require('mongoose');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const Result = require('../models/Result');
const Certificate = require('../models/Certificate');
const ExamAttempt = require('../models/ExamAttempt');
const Group = require('../models/Group');
const Student = require('../models/Student');
const { generateResultsExcel } = require('../utils/exportResultsExcel');

// @desc    Get results with group, course, department, semester filtering & group stats
// @route   GET /api/results
// @access  Private
exports.getResults = async (req, res, next) => {
  try {
    const { studentId, examId, groupId, course, department, semester } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    } else if (studentId) {
      query.studentId = studentId;
    }

    if (examId) {
      query.examId = examId;
    }

    // Handle Group / Academic Filtering
    let studentUserIds = null;
    let targetGroup = null;

    if (groupId) {
      targetGroup = await Group.findById(groupId).populate('students', '_id');
      if (targetGroup) {
        // Find students assigned to this group in Group model OR Student model
        const studentDocs = await Student.find({ groupId: targetGroup._id }).select('userId');
        const idsFromStudentDoc = studentDocs.map((s) => s.userId.toString());
        const idsFromGroupDoc = targetGroup.students.map((s) => s._id.toString());
        studentUserIds = Array.from(new Set([...idsFromStudentDoc, ...idsFromGroupDoc]));
        query.studentId = { $in: studentUserIds };
      }
    } else if (course || department || semester) {
      const filter = {};
      if (course) filter.course = { $regex: course, $options: 'i' };
      if (department) filter.branch = { $regex: department, $options: 'i' };
      if (semester) filter.semester = semester;

      const matchedStudents = await Student.find(filter).select('userId');
      studentUserIds = matchedStudents.map((s) => s.userId.toString());
      query.studentId = { $in: studentUserIds };
    }

    const results = await Result.find(query)
      .populate('studentId', 'name email')
      .populate('examId', 'title totalMarks category')
      .sort({ createdAt: -1 });

    // Populate student profiles with Group for result list
    const resultUserIds = results.map((r) => r.studentId?._id).filter(Boolean);
    const studentProfiles = await Student.find({ userId: { $in: resultUserIds } }).populate('groupId', 'name code');
    const profileMap = {};
    studentProfiles.forEach((sp) => {
      profileMap[sp.userId.toString()] = sp;
    });

    const enrichedResults = results.map((r) => {
      const obj = r.toObject();
      if (obj.studentId && obj.studentId._id) {
        obj.studentProfile = profileMap[obj.studentId._id.toString()] || null;
      }
      return obj;
    });

    // Build student summary matrix for multi-attempt tracking (Best vs Latest Scores)
    const studentMatrixMap = {};
    results.forEach((r) => {
      const sId = r.studentId?._id?.toString() || r.studentId?.toString();
      if (!sId) return;

      if (!studentMatrixMap[sId]) {
        const prof = profileMap[sId];
        studentMatrixMap[sId] = {
          studentId: r.studentId,
          studentName: r.studentId?.name || 'Unknown',
          email: r.studentId?.email || '',
          rollNumber: prof?.rollNumber || prof?.enrollmentNumber || 'N/A',
          studentProfile: prof || null,
          attemptCount: 0,
          bestScore: 0,
          latestScore: 0,
          bestPercentage: 0,
          latestPercentage: 0,
          latestStatus: 'Fail',
          latestSubmittedAt: r.createdAt,
          attempts: [],
        };
      }

      const entry = studentMatrixMap[sId];
      entry.attemptCount += 1;
      entry.attempts.push(r);

      if (r.totalScore > entry.bestScore) {
        entry.bestScore = r.totalScore;
        entry.bestPercentage = r.percentage || 0;
      }
      if (entry.attempts.length === 1) {
        entry.latestScore = r.totalScore;
        entry.latestPercentage = r.percentage || 0;
        entry.latestStatus = r.status;
        entry.latestSubmittedAt = r.createdAt;
      }
    });

    const studentMatrix = Object.values(studentMatrixMap);

    // Group-wise Stats Calculation
    let groupStats = null;
    if (groupId && targetGroup) {
      const totalStudents = studentUserIds ? studentUserIds.length : 0;
      const attemptedCount = results.length;
      const notAttemptedCount = Math.max(0, totalStudents - attemptedCount);

      let averageScore = 0;
      let highestScore = 0;
      let lowestScore = 0;
      let passCount = 0;
      let failCount = 0;

      if (results.length > 0) {
        const scores = results.map((r) => r.percentage || 0);
        averageScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
        highestScore = Math.max(...scores);
        lowestScore = Math.min(...scores);
        passCount = results.filter((r) => r.status === 'Pass').length;
        failCount = results.filter((r) => r.status === 'Fail').length;
      }

      groupStats = {
        groupName: targetGroup.name,
        groupCode: targetGroup.code,
        college: targetGroup.college,
        totalStudents,
        attemptedCount,
        notAttemptedCount,
        averageScore,
        highestScore,
        lowestScore,
        passCount,
        failCount,
      };
    }

    res.status(200).json({
      success: true,
      count: enrichedResults.length,
      groupStats,
      results: enrichedResults,
      studentMatrix,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed result by ID
// @route   GET /api/results/:id
// @access  Private
exports.getResultById = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('examId')
      .populate({
        path: 'attemptId',
        populate: { path: 'answers.questionId' },
      });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    const certificate = await Certificate.findOne({ resultId: result._id });

    res.status(200).json({ success: true, result, certificate });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Leaderboard
// @route   GET /api/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { examId, groupId } = req.query;
    const query = {};
    if (examId) query.examId = examId;

    if (groupId) {
      const studentDocs = await Student.find({ groupId }).select('userId');
      const groupUserIds = studentDocs.map((s) => s.userId);
      query.studentId = { $in: groupUserIds };
    }

    const leaderboard = await Result.find(query)
      .populate('studentId', 'name email profileImage')
      .populate('examId', 'title')
      .sort({ totalScore: -1, percentage: -1, evaluatedAt: 1 })
      .limit(50);

    const formatted = leaderboard.map((item, index) => ({
      rank: index + 1,
      studentName: item.studentId ? item.studentId.name : 'Unknown Student',
      studentEmail: item.studentId ? item.studentId.email : '',
      examTitle: item.examId ? item.examId.title : 'General Exam',
      totalScore: item.totalScore,
      percentage: item.percentage,
      status: item.status,
      evaluatedAt: item.evaluatedAt,
    }));

    res.status(200).json({ success: true, leaderboard: formatted });
  } catch (err) {
    next(err);
  }
};

// @desc    Get certificates for student
// @route   GET /api/certificates
// @access  Private
exports.getCertificates = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    }

    const certificates = await Certificate.find(query)
      .populate('studentId', 'name email')
      .populate('examId', 'title')
      .sort({ issueDate: -1 });

    res.status(200).json({ success: true, count: certificates.length, certificates });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Certificate Publicly
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('studentId', 'name email')
      .populate('examId', 'title category totalMarks');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate invalid or not found' });
    }

    res.status(200).json({
      success: true,
      valid: true,
      certificate,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export Results as Excel Spreadsheet (.xlsx)
// @route   GET /api/results/export/excel
// @access  Private (Faculty, Admin, Student)
exports.exportResultsExcel = async (req, res, next) => {
  try {
    const { examId, groupId, courseId, course, department, studentId } = req.query;
    const query = {};

    const Exam = require('../models/Exam');
    const ExamAssignment = require('../models/ExamAssignment');
    const { generateResultsExcel } = require('../utils/exportResultsExcel');

    // 1. Enforce Role & Ownership Authorization
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    } else if (studentId) {
      query.studentId = studentId;
    }

    if (req.user.role === 'faculty') {
      // Find all exams created by or assigned by this faculty
      const ownExams = await Exam.find({ facultyId: req.user._id }).select('_id');
      const ownExamIds = ownExams.map((e) => e._id.toString());

      const assignedDocs = await ExamAssignment.find({ facultyId: req.user._id }).select('examId');
      const assignedExamIds = assignedDocs.map((a) => a.examId.toString());

      const authorizedExamIds = Array.from(new Set([...ownExamIds, ...assignedExamIds]));

      if (examId) {
        if (!authorizedExamIds.includes(examId.toString())) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to export results for this exam',
          });
        }
        query.examId = examId;
      } else {
        query.examId = { $in: authorizedExamIds };
      }
    } else if (examId) {
      query.examId = examId;
    }

    // 2. Handle Group / Course / Department Filters
    let studentUserIds = null;
    let targetGroup = null;

    if (groupId) {
      targetGroup = await Group.findById(groupId).populate('students', '_id');
      if (targetGroup) {
        const studentDocs = await Student.find({ groupId: targetGroup._id }).select('userId');
        const idsFromStudentDoc = studentDocs.map((s) => s.userId.toString());
        const idsFromGroupDoc = targetGroup.students.map((s) => s._id.toString());
        studentUserIds = Array.from(new Set([...idsFromStudentDoc, ...idsFromGroupDoc]));

        if (query.studentId && query.studentId !== req.user._id) {
          if (!studentUserIds.includes(query.studentId.toString())) {
            return res.status(404).json({ success: false, message: 'No results found for the selected filters' });
          }
        } else if (req.user.role !== 'student') {
          query.studentId = { $in: studentUserIds };
        }
      }
    }

    const selectedCourse = courseId || course;
    if (selectedCourse || department) {
      const filter = {};
      if (selectedCourse) filter.course = { $regex: selectedCourse, $options: 'i' };
      if (department) filter.branch = { $regex: department, $options: 'i' };

      const matchedStudents = await Student.find(filter).select('userId');
      const filterUserIds = matchedStudents.map((s) => s.userId.toString());

      if (query.studentId && Array.isArray(query.studentId.$in)) {
        query.studentId.$in = query.studentId.$in.filter((id) => filterUserIds.includes(id));
      } else if (!query.studentId) {
        query.studentId = { $in: filterUserIds };
      }
    }

    // 3. Fetch Results from DB
    const results = await Result.find(query)
      .populate('studentId', 'name email')
      .populate('examId', 'title totalMarks duration codingProblems questions')
      .populate({
        path: 'attemptId',
        populate: { path: 'answers.questionId' },
      })
      .sort({ createdAt: -1 });

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for the selected filters',
      });
    }

    // 4. Fetch Student profiles with Group info
    const resultUserIds = Array.from(new Set(results.map((r) => r.studentId?._id?.toString()).filter(Boolean)));
    const studentProfiles = await Student.find({ userId: { $in: resultUserIds } }).populate('groupId', 'name code course department');
    const profileMap = {};
    studentProfiles.forEach((sp) => {
      if (sp.userId) profileMap[sp.userId.toString()] = sp;
    });

    // 5. Determine Filename
    let targetExamTitle = results[0]?.examId?.title || 'Assessment';
    let fileName = `${targetExamTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Results.xlsx`;

    if (query.studentId && typeof query.studentId === 'string') {
      const studentName = results[0]?.studentId?.name || 'Student';
      fileName = `${studentName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${targetExamTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Result.xlsx`;
    } else if (targetGroup) {
      fileName = `${targetGroup.code || 'Group'}_${targetExamTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Results.xlsx`;
    }

    // 6. Generate Excel workbook buffer
    const excelBuffer = generateResultsExcel(results, profileMap, {
      examTitle: targetExamTitle,
    });

    // 7. Send Download Response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(excelBuffer);
  } catch (err) {
    next(err);
  }
};

// @desc    Re-evaluate or Grant Bonus Marks to a Student Result
// @route   PUT /api/results/:id/re-evaluate
// @access  Private (Faculty, Admin)
exports.reEvaluateResult = async (req, res, next) => {
  try {
    const { bonusMarks = 0 } = req.body;
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    const added = Number(bonusMarks) || 0;
    result.objectiveScore = (result.objectiveScore || 0) + added;
    result.totalScore = (result.totalScore || 0) + added;
    result.percentage = Number(((result.totalScore / result.totalMarks) * 100).toFixed(2));
    if (result.percentage >= 40) {
      result.status = 'Pass';
    }

    await result.save();

    res.status(200).json({
      success: true,
      message: `Successfully re-evaluated result and awarded +${added} bonus marks!`,
      result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete single attempt/result record
// @route   DELETE /api/assessments/:assessmentId/attempts/:attemptId OR DELETE /api/results/:id
// @access  Private (Faculty, Admin)
exports.deleteAttemptResult = async (req, res, next) => {
  try {
    const attemptId = req.params.attemptId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ success: false, message: 'Invalid attempt ID' });
    }

    let attemptDoc = await ExamAttempt.findById(attemptId).populate('examId');
    let resultDoc = null;

    if (attemptDoc) {
      resultDoc = await Result.findOne({ attemptId: attemptDoc._id });
    } else {
      resultDoc = await Result.findById(attemptId).populate('examId');
      if (resultDoc) {
        attemptDoc = await ExamAttempt.findById(resultDoc.attemptId);
      }
    }

    if (!attemptDoc && !resultDoc) {
      return res.status(404).json({ success: false, message: 'Attempt result record not found' });
    }

    const exam = attemptDoc?.examId || resultDoc?.examId;

    // Faculty Authorization Check
    if (req.user.role === 'faculty' && exam) {
      const examFacultyId = exam.facultyId ? exam.facultyId.toString() : exam.toString();
      if (examFacultyId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete results for this assessment' });
      }
    }

    // Delete ONLY target ExamAttempt and Result (and associated Certificate if any)
    if (resultDoc) {
      await Certificate.deleteMany({ resultId: resultDoc._id });
      await resultDoc.deleteOne();
    }

    if (attemptDoc) {
      await attemptDoc.deleteOne();
    }

    res.status(200).json({
      success: true,
      message: 'Attempt result permanently deleted',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all attempts of a student for an assessment
// @route   GET /api/assessments/:assessmentId/students/:studentId/attempts
// @access  Private
exports.getAssessmentStudentAttempts = async (req, res, next) => {
  try {
    const { assessmentId, studentId } = req.params;

    // Security check: student can only view their own attempts
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to student attempts' });
    }

    const attempts = await ExamAttempt.find({
      examId: assessmentId,
      studentId: studentId,
    }).sort({ attemptNumber: 1, createdAt: 1 });

    const results = await Result.find({
      examId: assessmentId,
      studentId: studentId,
    });

    const resultMap = {};
    results.forEach((r) => {
      if (r.attemptId) resultMap[r.attemptId.toString()] = r;
    });

    const attemptsData = attempts.map((att, idx) => {
      const resDoc = resultMap[att._id.toString()];
      const timeTakenSec = att.submittedAt && att.startedAt ? Math.floor((new Date(att.submittedAt) - new Date(att.startedAt)) / 1000) : 0;
      const timeTakenMin = Math.round(timeTakenSec / 60);

      return {
        attemptId: att._id,
        attemptNumber: att.attemptNumber || idx + 1,
        status: att.status,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        timeTakenMin,
        score: resDoc ? resDoc.totalScore : 0,
        totalMarks: resDoc ? resDoc.totalMarks : 0,
        percentage: resDoc ? resDoc.percentage : 0,
        resultStatus: resDoc ? resDoc.status : (att.status === 'submitted' ? 'Evaluated' : 'In Progress'),
        resultId: resDoc ? resDoc._id : null,
      };
    });

    res.status(200).json({
      success: true,
      attempts: attemptsData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assessment level result statistics for faculty dashboard
// @route   GET /api/assessments/:assessmentId/result-statistics
// @access  Private (Faculty, Admin)
exports.getAssessmentResultStatistics = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const exam = await Exam.findById(assessmentId).populate('targetGroups');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Authorization check
    if (req.user.role === 'faculty' && exam.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this assessment' });
    }

    // Get assigned students count
    let assignedStudentIds = [];
    if (exam.targetGroups && exam.targetGroups.length > 0) {
      const groupIds = exam.targetGroups.map((g) => g._id);
      const studentDocs = await Student.find({ groupId: { $in: groupIds } }).select('userId');
      assignedStudentIds = studentDocs.map((s) => s.userId.toString());
    }

    const allResults = await Result.find({ examId: assessmentId }).populate('studentId', 'name email');
    const totalAttempts = allResults.length;

    const studentMap = {};
    allResults.forEach((r) => {
      const sId = r.studentId?._id?.toString() || r.studentId?.toString();
      if (!studentMap[sId]) studentMap[sId] = [];
      studentMap[sId].push(r);
    });

    const attemptedStudentIds = Object.keys(studentMap);
    const totalAttempted = attemptedStudentIds.length;
    const totalAssigned = Math.max(assignedStudentIds.length, totalAttempted);
    const notAttemptedCount = Math.max(0, totalAssigned - totalAttempted);

    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    let averagePercentage = 0;
    let passCount = 0;
    let failCount = 0;

    if (allResults.length > 0) {
      const scores = allResults.map((r) => r.totalScore || 0);
      const pcts = allResults.map((r) => r.percentage || 0);
      averageScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      averagePercentage = Number((pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(2));
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
      passCount = allResults.filter((r) => r.status === 'Pass').length;
      failCount = allResults.filter((r) => r.status === 'Fail').length;
    }

    res.status(200).json({
      success: true,
      statistics: {
        assessmentTitle: exam.title,
        totalAssigned,
        totalAttempted,
        notAttemptedCount,
        totalAttempts,
        averageScore,
        highestScore,
        lowestScore,
        averagePercentage,
        passCount,
        failCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
