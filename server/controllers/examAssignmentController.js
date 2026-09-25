const ExamAssignment = require('../models/ExamAssignment');
const Exam = require('../models/Exam');
const Group = require('../models/Group');
const ExamAttempt = require('../models/ExamAttempt');
const Student = require('../models/Student');

const collegeFilter = (req, query = {}) => (req?.collegeId ? { ...query, collegeId: req.collegeId } : query);

const resolveEligibleStudentIds = async (groupIds = [], studentIds = [], req = null) => {
  const validStudents = await Student.find(collegeFilter(req, { userId: { $in: studentIds } })).select('userId');
  const uniqueIds = new Set(validStudents.map((student) => student.userId.toString()));

  if (groupIds.length > 0) {
    const groups = await Group.find(collegeFilter(req, { _id: { $in: groupIds } })).select('students');
    groups.forEach((group) => {
      group.students.forEach((studentId) => uniqueIds.add(studentId.toString()));
    });
  }

  return [...uniqueIds];
};

const findDuplicateAssignment = async (examId, facultyId, groupIds = [], studentIds = [], excludeId = null, req = null) => {
  const query = {
    examId,
    facultyId,
    status: { $ne: 'archived' },
    ...(req?.collegeId ? { collegeId: req.collegeId } : {}),
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await ExamAssignment.find(query);

  for (const assignment of existing) {
    const overlappingGroups = groupIds.filter((gid) =>
      assignment.groupIds.some((existingId) => existingId.toString() === gid.toString())
    );

    const overlappingStudents = studentIds.filter((sid) =>
      assignment.studentIds.some((existingId) => existingId.toString() === sid.toString())
    );

    if (overlappingGroups.length > 0 || overlappingStudents.length > 0) {
      return assignment;
    }
  }

  return null;
};

exports.isStudentAuthorizedForExam = async (studentId, examId, collegeId = null) => {
  const now = new Date();
  const Student = require('../models/Student');

  const scoped = collegeId ? { collegeId } : {};
  const studentRec = await Student.findOne({ userId: studentId, ...scoped });

  const groupQuery = [{ students: studentId }];
  if (studentRec && studentRec.groupId) {
    groupQuery.push({ _id: studentRec.groupId });
  }

  const studentGroups = await Group.find({ ...scoped, $or: groupQuery }).select('_id');
  const studentGroupIds = studentGroups.map((g) => g._id);

  const anyAssignment = await ExamAssignment.findOne({
    examId,
    ...scoped,
    status: 'published',
    $or: [
      { studentIds: studentId },
      { groupIds: { $in: studentGroupIds } },
    ],
  });

  if (anyAssignment && anyAssignment.endDate && new Date(anyAssignment.endDate) < now) {
    return { authorized: false, assignment: anyAssignment, reason: 'This assessment has expired and is no longer accepting attempts.' };
  }

  let assignment = await ExamAssignment.findOne({
    examId,
    ...scoped,
    status: 'published',
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { studentIds: studentId },
      { groupIds: { $in: studentGroupIds } },
    ],
  });

  if (!assignment) {
    // Check if the Exam model has direct targetGroups matching studentGroupIds
    const examObj = await Exam.findOne({
      _id: examId,
      ...scoped,
      status: 'published',
      startDate: { $lte: now },
      endDate: { $gte: now },
      targetGroups: { $in: studentGroupIds },
    });

    if (!examObj) {
      return { authorized: false, assignment: null, reason: 'You are not in an assigned group for this exam.' };
    }
  }

  const attemptsAllowed = assignment ? assignment.attemptsAllowed : 1;

  const attemptCount = await ExamAttempt.countDocuments({
    studentId,
    examId,
    ...scoped,
    status: { $in: ['submitted', 'auto-submitted', 'evaluated'] },
  });

  if (attemptCount >= attemptsAllowed) {
    return {
      authorized: false,
      assignment,
      reason: 'Maximum attempts reached for this assignment',
    };
  }

  return { authorized: true, assignment };
};

exports.createAssignment = async (req, res, next) => {
  try {
    const {
      examId,
      groupIds = [],
      studentIds = [],
      assignmentType,
      startDate,
      endDate,
      duration,
      attemptsAllowed,
      title,
      notes,
    } = req.body;

    if (!examId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'examId, startDate, and endDate are required',
      });
    }

    if (groupIds.length === 0 && studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one group or student must be selected',
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const exam = await Exam.findOne({ _id: examId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user.role === 'faculty' && exam.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to assign this exam' });
    }

    const eligibleStudentIds = await resolveEligibleStudentIds(groupIds, studentIds, req);
    if (eligibleStudentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid students or groups were selected' });
    }

    const duplicate = await findDuplicateAssignment(examId, req.user._id, groupIds, eligibleStudentIds, null, req);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'An assignment for this exam with overlapping groups or students already exists',
        assignment: duplicate,
      });
    }

    let resolvedType = assignmentType;
    if (!resolvedType) {
      if (groupIds.length > 0 && studentIds.length > 0) resolvedType = 'mixed';
      else if (studentIds.length > 0) resolvedType = 'individual';
      else resolvedType = 'group';
    }

    const assignment = await ExamAssignment.create({
      examId,
      collegeId: req.collegeId || exam.collegeId || undefined,
      facultyId: req.user._id,
      groupIds,
      studentIds: eligibleStudentIds,
      assignmentType: resolvedType,
      startDate,
      endDate,
      duration: duration || exam.duration,
      attemptsAllowed: attemptsAllowed || 1,
      title: title || exam.title,
      notes: notes || '',
      status: 'draft',
    });

    const populated = await ExamAssignment.findById(assignment._id)
      .populate('examId', 'title duration status category')
      .populate('groupIds', 'name code')
      .populate('studentIds', 'name email');

    // Asynchronous background email notification to assigned students
    resolveEligibleStudentIds(groupIds, studentIds, req).then(async (eligibleIds) => {
      if (eligibleIds.length > 0) {
        const User = require('../models/User');
        const sendEmail = require('../utils/sendEmail');
        const students = await User.find({ _id: { $in: eligibleIds } }).select('email name');
        const examUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/student/assigned-exams`;
        for (const s of students) {
          if (s.email) {
            sendEmail({
              email: s.email,
              subject: `📢 New Assessment Assigned: ${populated.title || exam.title}`,
              message: `Hello ${s.name},\n\nA new assessment "${populated.title || exam.title}" has been assigned to your group.\n\nDeadline: ${new Date(endDate).toLocaleDateString()}\nDuration: ${duration || exam.duration} Mins\n\nClick to access your exam: ${examUrl}\n\nBest of Luck!`,
            }).catch(() => {});
          }
        }
      }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Exam assignment created and student email notifications dispatched',
      assignment: populated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate assignment for this exam and group combination',
      });
    }
    next(err);
  }
};

exports.getMyAssignments = async (req, res, next) => {
  try {
    const query = { facultyId: req.user._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) };
    if (req.query.status) query.status = req.query.status;

    const assignments = await ExamAssignment.find(query)
      .populate('examId', 'title duration status category totalMarks')
      .populate('groupIds', 'name code students')
      .populate('studentIds', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await ExamAssignment.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .populate('examId', 'title duration status category totalMarks startDate endDate')
      .populate('groupIds', 'name code students')
      .populate('studentIds', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (
      req.user.role === 'faculty' &&
      assignment.facultyId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, assignment });
  } catch (err) {
    next(err);
  }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    let assignment = await ExamAssignment.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.facultyId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (assignment.status === 'archived') {
      return res.status(400).json({ success: false, message: 'Cannot update archived assignment' });
    }

    const {
      groupIds,
      studentIds,
      assignmentType,
      startDate,
      endDate,
      duration,
      attemptsAllowed,
      title,
      notes,
    } = req.body;

    const nextGroupIds = groupIds !== undefined ? groupIds : assignment.groupIds;
    const nextStudentIds = studentIds !== undefined ? studentIds : assignment.studentIds;

    if (nextGroupIds.length === 0 && nextStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one group or student must be selected',
      });
    }

    const duplicate = await findDuplicateAssignment(
      assignment.examId,
      assignment.facultyId,
      nextGroupIds,
      nextStudentIds,
      assignment._id,
      req
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'An assignment with overlapping groups or students already exists',
      });
    }

    if (groupIds !== undefined) assignment.groupIds = groupIds;
    if (studentIds !== undefined) assignment.studentIds = studentIds;
    if (assignmentType) assignment.assignmentType = assignmentType;
    if (startDate) assignment.startDate = startDate;
    if (endDate) assignment.endDate = endDate;
    if (duration) assignment.duration = duration;
    if (attemptsAllowed) assignment.attemptsAllowed = attemptsAllowed;
    if (title !== undefined) assignment.title = title;
    if (notes !== undefined) assignment.notes = notes;

    await assignment.save();

    assignment = await ExamAssignment.findOne({ _id: assignment._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .populate('examId', 'title duration status category')
      .populate('groupIds', 'name code')
      .populate('studentIds', 'name email');

    res.status(200).json({
      success: true,
      message: 'Assignment updated',
      assignment,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await ExamAssignment.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.facultyId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await assignment.deleteOne();

    res.status(200).json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
};

exports.publishAssignment = async (req, res, next) => {
  try {
    const assignment = await ExamAssignment.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.facultyId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const exam = await Exam.findOne({ _id: assignment.examId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Linked exam not found' });
    }

    if (exam.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Exam must be published before the assignment can be published',
      });
    }

    assignment.status = 'published';
    await assignment.save();

    const populated = await ExamAssignment.findOne({ _id: assignment._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .populate('examId', 'title duration status category')
      .populate('groupIds', 'name code')
      .populate('studentIds', 'name email');

    res.status(200).json({
      success: true,
      message: 'Assignment published',
      assignment: populated,
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudentAssignedExams = async (req, res, next) => {
  try {
    const now = new Date();
    const studentId = req.user._id;

    const Student = require('../models/Student');
    const studentRec = await Student.findOne({ userId: studentId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    const groupQuery = [{ students: studentId }];
    if (studentRec && studentRec.groupId) {
      groupQuery.push({ _id: studentRec.groupId });
    }

    const studentGroups = await Group.find({ ...(req.collegeId ? { collegeId: req.collegeId } : {}), $or: groupQuery }).select('_id');
    const studentGroupIds = studentGroups.map((g) => g._id);

    const assignments = await ExamAssignment.find({
      status: 'published',
      ...(req.collegeId ? { collegeId: req.collegeId } : {}),
      $or: [
        { studentIds: studentId },
        { groupIds: { $in: studentGroupIds } },
      ],
    })
      .populate({
        path: 'examId',
        select: 'title description category duration totalMarks passingMarks status questions codingProblems',
        populate: [
          { path: 'questions', select: 'questionText marks' },
          { path: 'codingProblems', select: 'title difficulty' },
        ],
      })
      .populate('groupIds', 'name code')
      .populate('facultyId', 'name email')
      .sort({ createdAt: -1 });

    const assignmentsWithAttempts = (await Promise.all(
      assignments.map(async (assignment) => {
        if (!assignment.examId) return null;

        const attempt = await ExamAttempt.findOne({
          studentId,
          examId: assignment.examId._id,
          ...(req.collegeId ? { collegeId: req.collegeId } : {}),
        }).select('status startedAt submittedAt remainingTime');

        const completedAttempts = await ExamAttempt.countDocuments({
          studentId,
          examId: assignment.examId._id,
          ...(req.collegeId ? { collegeId: req.collegeId } : {}),
          status: { $in: ['submitted', 'auto-submitted', 'evaluated'] },
        });

        const isExpired = assignment.endDate ? new Date(assignment.endDate) < now : false;
        const attemptsUsed = completedAttempts;
        const attemptsAllowed = assignment.attemptsAllowed || 1;
        const attemptsRemaining = Math.max(0, attemptsAllowed - completedAttempts);
        const isCompleted = attemptsRemaining <= 0 || ['submitted', 'auto-submitted', 'evaluated'].includes(attempt?.status);
        const isInProgress = attempt?.status === 'started' && !isExpired;

        let computedStatus = 'available';
        if (isCompleted) {
          computedStatus = 'completed';
        } else if (isExpired) {
          computedStatus = 'expired';
        } else if (isInProgress) {
          computedStatus = 'in_progress';
        }

        return {
          ...assignment.toObject(),
          attempt,
          attemptsUsed,
          attemptsAllowed,
          attemptsRemaining,
          isExpired,
          isCompleted,
          isInProgress,
          computedStatus,
        };
      })
    )).filter(Boolean);

    res.status(200).json({
      success: true,
      count: assignmentsWithAttempts.length,
      assignments: assignmentsWithAttempts,
    });
  } catch (err) {
    next(err);
  }
};

exports.getEligibleStudentCount = async (req, res, next) => {
  try {
    let groupIds = req.query.groupIds || [];
    let studentIds = req.query.studentIds || [];

    if (typeof groupIds === 'string') groupIds = groupIds ? groupIds.split(',') : [];
    if (typeof studentIds === 'string') studentIds = studentIds ? studentIds.split(',') : [];

    const eligibleIds = await resolveEligibleStudentIds(groupIds, studentIds, req);

    res.status(200).json({
      success: true,
      count: eligibleIds.length,
      studentIds: eligibleIds,
    });
  } catch (err) {
    next(err);
  }
};
