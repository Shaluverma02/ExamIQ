const Exam = require('../models/Exam');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const ExamAttempt = require('../models/ExamAttempt');
const CodingSubmission = require('../models/CodingSubmission');
const Result = require('../models/Result');
const Certificate = require('../models/Certificate');
const { isStudentAuthorizedForExam } = require('./examAssignmentController');
const crypto = require('crypto');

// @desc    Get all exams (for student available/active or faculty list)
// @route   GET /api/exams
// @access  Private
exports.getExams = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    // Faculty only views their own exams unless admin
    if (req.user.role === 'faculty') {
      query.facultyId = req.user._id;
    } else if (req.user.role === 'student') {
      query.status = 'published';

      const Group = require('../models/Group');
      const Student = require('../models/Student');
      const ExamAssignment = require('../models/ExamAssignment');

      // 1. Get student's group IDs
      const studentRec = await Student.findOne({ userId: req.user._id });
      const groupQuery = [{ students: req.user._id }];
      if (studentRec && studentRec.groupId) {
        groupQuery.push({ _id: studentRec.groupId });
      }

      const studentGroups = await Group.find({ $or: groupQuery }).select('_id');
      const studentGroupIds = studentGroups.map((g) => g._id);

      // 2. Find published assignments for this student or their groups
      const assignments = await ExamAssignment.find({
        status: 'published',
        $or: [
          { studentIds: req.user._id },
          { groupIds: { $in: studentGroupIds } },
        ],
      }).select('examId');

      const assignedExamIds = assignments.map((a) => a.examId ? a.examId.toString() : '');

      // 3. Fetch all published exams
      const allExams = await Exam.find(query)
        .populate('facultyId', 'name email')
        .sort({ createdAt: -1 });

      // 4. Filter out any exam NOT assigned to this student
      const filteredExams = [];
      for (const exam of allExams) {
        const isViaAssignment = assignedExamIds.includes(exam._id.toString());
        const isViaTargetGroup = exam.targetGroups && exam.targetGroups.some((gId) =>
          studentGroupIds.some((sgId) => sgId.toString() === gId.toString())
        );

        const hasAnyAssignmentRecord = await ExamAssignment.exists({ examId: exam._id, status: 'published' });
        const hasTargetGroups = exam.targetGroups && exam.targetGroups.length > 0;

        if (hasAnyAssignmentRecord || hasTargetGroups) {
          if (isViaAssignment || isViaTargetGroup) {
            filteredExams.push(exam);
          }
        } else {
          // General unassigned/public exam
          filteredExams.push(exam);
        }
      }

      return res.status(200).json({ success: true, count: filteredExams.length, exams: filteredExams });
    }

    const exams = await Exam.find(query)
      .populate('facultyId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: exams.length, exams });
  } catch (err) {
    next(err);
  }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private
exports.getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('questions')
      .populate('codingProblems')
      .populate('facultyId', 'name email');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check if student is authorized
    let attempt = null;
    if (req.user.role === 'student') {
      const Group = require('../models/Group');
      const Student = require('../models/Student');
      const ExamAssignment = require('../models/ExamAssignment');

      const studentRec = await Student.findOne({ userId: req.user._id });
      const groupQuery = [{ students: req.user._id }];
      if (studentRec && studentRec.groupId) {
        groupQuery.push({ _id: studentRec.groupId });
      }

      const studentGroups = await Group.find({ $or: groupQuery }).select('_id');
      const studentGroupIds = studentGroups.map((g) => g._id);

      const hasAssignmentRecord = await ExamAssignment.exists({ examId: exam._id, status: 'published' });
      const hasTargetGroups = exam.targetGroups && exam.targetGroups.length > 0;

      if (hasAssignmentRecord || hasTargetGroups) {
        const isAssigned = await ExamAssignment.exists({
          examId: exam._id,
          status: 'published',
          $or: [
            { studentIds: req.user._id },
            { groupIds: { $in: studentGroupIds } },
          ],
        });

        const isTargeted = exam.targetGroups && exam.targetGroups.some((gId) =>
          studentGroupIds.some((sgId) => sgId.toString() === gId.toString())
        );

        if (!isAssigned && !isTargeted) {
          return res.status(403).json({ success: false, message: 'This assessment is not assigned to you.' });
        }
      }

      attempt = await ExamAttempt.findOne({
        studentId: req.user._id,
        examId: exam._id,
      });
    }

    res.status(200).json({
      success: true,
      exam,
      attempt,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create exam
// @route   POST /api/exams
// @access  Private (Faculty, Admin)
exports.createExam = async (req, res, next) => {
  try {
    req.body.facultyId = req.user._id;
    const exam = await Exam.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      exam,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Faculty, Admin)
exports.updateExam = async (req, res, next) => {
  try {
    let exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user.role !== 'admin' && exam.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Exam updated', exam });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Faculty, Admin)
exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    await exam.deleteOne();
    res.status(200).json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Start Exam Attempt (Server Authoritative Timer)
// @route   POST /api/exams/:id/start
// @access  Private (Student)
exports.startExamAttempt = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('questions')
      .populate('codingProblems');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Exam is not published yet' });
    }

    const authCheck = await isStudentAuthorizedForExam(req.user._id, exam._id);
    if (!authCheck.authorized) {
      return res.status(403).json({
        success: false,
        message: authCheck.reason || 'You are not assigned to this exam',
      });
    }

    let attempt = await ExamAttempt.findOne({
      studentId: req.user._id,
      examId: exam._id,
      status: 'started',
    }).sort({ attemptNumber: -1 });

    const totalSeconds = (exam.duration || 60) * 60;

    if (!attempt) {
      const existingAttempts = await ExamAttempt.find({
        studentId: req.user._id,
        examId: exam._id,
      });

      const attemptCount = existingAttempts.length;

      if (attemptCount > 0 && exam.allowRetake === false) {
        return res.status(400).json({
          success: false,
          message: 'Retake is disabled for this assessment',
        });
      }

      if (exam.maxAttempts && exam.maxAttempts > 0 && attemptCount >= exam.maxAttempts) {
        return res.status(400).json({
          success: false,
          message: `Maximum attempts reached (${attemptCount} / ${exam.maxAttempts})`,
        });
      }

      attempt = await ExamAttempt.create({
        studentId: req.user._id,
        examId: exam._id,
        attemptNumber: attemptCount + 1,
        startedAt: new Date(),
        remainingTime: totalSeconds,
        status: 'started',
        answers: (exam.questions || []).map((q) => ({
          questionId: q._id,
          selectedOptions: [],
          isMarkedForReview: false,
          isVisited: false,
        })),
        codingSubmissions: [],
        antiCheatLogs: [],
      });
    } else {
      // Calculate server authoritative remaining time
      const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      const serverRemaining = totalSeconds - elapsedSeconds;

      if (serverRemaining <= 0 || attempt.status === 'submitted') {
        attempt.status = 'submitted';
        attempt.remainingTime = 0;
        await attempt.save();
        return res.status(400).json({
          success: false,
          alreadySubmitted: true,
          message: 'Exam duration has elapsed or attempt has already been submitted',
          attempt,
        });
      }

      attempt.remainingTime = serverRemaining;
      await attempt.save();
    }

    // Prepare questions for student view (do not expose correct answers or explanations)
    const sanitizedQuestions = (exam.questions || []).map((q) => {
      const obj = q.toObject();
      obj.options = (obj.options || []).map((opt) => ({
        _id: opt._id,
        optionText: opt.optionText,
      }));
      delete obj.explanation;
      return obj;
    });

    res.status(200).json({
      success: true,
      message: 'Exam attempt active',
      attempt,
      exam: {
        _id: exam._id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        negativeMarking: exam.negativeMarking,
        allowRetake: exam.allowRetake,
        maxAttempts: exam.maxAttempts,
        questions: sanitizedQuestions,
        codingProblems: exam.codingProblems,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Auto-save current MCQ answer
// @route   POST /api/exams/:id/answer
// @access  Private (Student)
exports.saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOptions, isMarkedForReview } = req.body;

    const attempt = await ExamAttempt.findOne({
      studentId: req.user._id,
      examId: req.params.id,
      status: 'started',
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Active attempt not found' });
    }

    const answerIdx = attempt.answers.findIndex(
      (a) => a.questionId.toString() === questionId.toString()
    );

    if (answerIdx > -1) {
      if (selectedOptions !== undefined) attempt.answers[answerIdx].selectedOptions = selectedOptions;
      if (isMarkedForReview !== undefined) attempt.answers[answerIdx].isMarkedForReview = isMarkedForReview;
      attempt.answers[answerIdx].isVisited = true;
    } else {
      attempt.answers.push({
        questionId,
        selectedOptions: selectedOptions || [],
        isMarkedForReview: !!isMarkedForReview,
        isVisited: true,
      });
    }

    await attempt.save();
    res.status(200).json({ success: true, message: 'Answer saved' });
  } catch (err) {
    next(err);
  }
};

// @desc    Log Anti-Cheating Event
// @route   POST /api/exams/:id/anticheat
// @access  Private (Student)
exports.logAntiCheatEvent = async (req, res, next) => {
  try {
    const { eventType, metadata, snapshot } = req.body;

    const attempt = await ExamAttempt.findOne({
      studentId: req.user._id,
      examId: req.params.id,
      status: 'started',
    });

    if (attempt) {
      attempt.antiCheatLogs.push({
        eventType,
        metadata: metadata || '',
        snapshot: snapshot || '',
        timestamp: new Date(),
      });
      await attempt.save();
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit Exam (Final evaluation & score generation)
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
exports.submitExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('questions')
      .populate('codingProblems');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    let attempt = await ExamAttempt.findOne({
      studentId: req.user._id,
      examId: exam._id,
      status: 'started',
    }).sort({ attemptNumber: -1 });

    if (!attempt) {
      attempt = await ExamAttempt.findOne({
        studentId: req.user._id,
        examId: exam._id,
      }).sort({ attemptNumber: -1 });
    }

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
      const existingResult = await Result.findOne({ attemptId: attempt._id });
      return res.status(200).json({
        success: true,
        message: 'Exam already submitted',
        result: existingResult,
      });
    }

    attempt.status = 'submitted';
    attempt.submittedAt = new Date();

    // 1. Evaluate MCQ Objective Answers
    let objectiveScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let attemptedCount = 0;

    for (const q of (exam.questions || [])) {
      const studentAns = attempt.answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );

      if (!studentAns || !studentAns.selectedOptions || studentAns.selectedOptions.length === 0) {
        skippedCount++;
      } else {
        attemptedCount++;
        // Check correct option texts safely (prevent string 'false' from evaluating to true)
        const isOptTrue = (opt) => opt.isCorrect === true || opt.isCorrect === 'true' || opt.isCorrect === 1;

        const correctOptions = (q.options || [])
          .filter((opt) => isOptTrue(opt))
          .map((opt) => (opt.optionText || '').trim());

        const studentSelected = (studentAns.selectedOptions || [])
          .map((optText) => (optText || '').trim());

        const isCorrect =
          correctOptions.length > 0 &&
          studentSelected.length === correctOptions.length &&
          studentSelected.every((opt) => correctOptions.includes(opt));

        studentAns.isCorrect = isCorrect;

        if (isCorrect) {
          correctCount++;
          const earned = q.marks || 1;
          studentAns.marksObtained = earned;
          objectiveScore += earned;
        } else {
          wrongCount++;
          const penalty = exam.negativeMarking ? q.negativeMarks || 0.25 : 0;
          studentAns.marksObtained = -penalty;
          objectiveScore -= penalty;
        }
      }
    }

    objectiveScore = Math.max(0, objectiveScore);

    // 2. Evaluate Coding Submissions
    let codingScore = 0;
    for (const cp of (exam.codingProblems || [])) {
      const bestSubmission = await CodingSubmission.findOne({
        studentId: req.user._id,
        examId: exam._id,
        problemId: cp._id,
      }).sort({ score: -1 });

      if (bestSubmission) {
        codingScore += bestSubmission.score || 0;
      }
    }

    const totalScore = objectiveScore + codingScore;
    const percentage = Number(((totalScore / (exam.totalMarks || 100)) * 100).toFixed(2));
    const status = percentage >= (exam.passingMarks || 40) ? 'Pass' : 'Fail';

    await attempt.save();

    // 3. Create Result Record
    const result = await Result.create({
      studentId: req.user._id,
      examId: exam._id,
      attemptId: attempt._id,
      attemptNumber: attempt.attemptNumber || 1,
      objectiveScore,
      codingScore,
      totalScore,
      totalMarks: exam.totalMarks || 100,
      percentage,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      skippedAnswers: skippedCount,
      attemptedQuestions: attemptedCount,
      status,
    });

    // 4. Generate Certificate if Passed
    if (status === 'Pass') {
      const certId = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      await Certificate.create({
        certificateId: certId,
        studentId: req.user._id,
        examId: exam._id,
        resultId: result._id,
        score: totalScore,
        percentage,
        verificationUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-certificate/${certId}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exam submitted and evaluated successfully',
      result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Retake Assessment (Create New Attempt & Reset Session)
// @route   POST /api/assessments/:assessmentId/retake OR POST /api/exams/:id/retake
// @access  Private (Student)
exports.retakeAssessment = async (req, res, next) => {
  try {
    const examId = req.params.assessmentId || req.params.id;
    const exam = await Exam.findById(examId)
      .populate('questions')
      .populate('codingProblems');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (exam.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Assessment is not published yet' });
    }

    const authCheck = await isStudentAuthorizedForExam(req.user._id, exam._id);
    if (!authCheck.authorized) {
      return res.status(403).json({
        success: false,
        message: authCheck.reason || 'You are not assigned to this assessment',
      });
    }

    // Fetch student's previous attempts
    const previousAttempts = await ExamAttempt.find({
      studentId: req.user._id,
      examId: exam._id,
    }).sort({ attemptNumber: 1 });

    const totalPrevious = previousAttempts.length;

    // Retake Rules Validation
    if (totalPrevious > 0 && exam.allowRetake === false) {
      return res.status(400).json({
        success: false,
        message: 'Retake is disabled for this assessment',
      });
    }

    const maxLimit = exam.maxAttempts;
    if (maxLimit && maxLimit > 0 && totalPrevious >= maxLimit) {
      return res.status(400).json({
        success: false,
        message: `Maximum attempts reached (${totalPrevious} / ${maxLimit})`,
      });
    }

    // Finalize any previously unsubmitted active attempt before creating new retake session
    for (const oldAttempt of previousAttempts) {
      if (oldAttempt.status === 'started') {
        oldAttempt.status = 'submitted';
        oldAttempt.submittedAt = new Date();
        await oldAttempt.save();
      }
    }

    // Create Fresh Attempt
    const newAttemptNumber = totalPrevious + 1;
    const totalSeconds = (exam.duration || 60) * 60;

    const newAttempt = await ExamAttempt.create({
      studentId: req.user._id,
      examId: exam._id,
      attemptNumber: newAttemptNumber,
      startedAt: new Date(),
      remainingTime: totalSeconds,
      status: 'started',
      answers: (exam.questions || []).map((q) => ({
        questionId: q._id,
        selectedOptions: [],
        isMarkedForReview: false,
        isVisited: false,
      })),
      codingSubmissions: [],
      antiCheatLogs: [],
    });

    res.status(201).json({
      success: true,
      message: `Attempt #${newAttemptNumber} created successfully`,
      attempt: newAttempt,
      attemptNumber: newAttemptNumber,
      remainingTime: totalSeconds,
    });
  } catch (err) {
    next(err);
  }
};
