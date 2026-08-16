const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/User');

// @desc    Get real-time live monitoring data for an active assessment
// @route   GET /api/assessments/:assessmentId/live-monitor
// @access  Private (Faculty, Admin)
exports.getLiveAssessmentMonitoring = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const exam = await Exam.findById(assessmentId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const attempts = await ExamAttempt.find({ examId: assessmentId })
      .populate('studentId', 'name email profileImage rollNumber')
      .sort({ updatedAt: -1 });

    const activeStudents = attempts.map((att) => {
      const student = att.studentId || {};
      const warningsCount = (att.antiCheatLogs || []).length;
      const latestSnapshot = (att.antiCheatLogs || [])
        .filter((l) => l.snapshot)
        .slice(-1)[0]?.snapshot || '';

      const elapsed = Math.floor((Date.now() - new Date(att.startedAt).getTime()) / 1000);
      const totalSeconds = (exam.duration || 60) * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsed);

      return {
        attemptId: att._id,
        studentId: student._id,
        studentName: student.name || 'Unknown Student',
        studentEmail: student.email || '',
        studentRoll: student.rollNumber || 'N/A',
        studentAvatar: student.profileImage || '',
        status: att.status, // 'started', 'submitted', 'evaluated'
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        remainingSeconds,
        answeredCount: (att.answers || []).filter((a) => a.selectedOptions && a.selectedOptions.length > 0).length,
        codingCount: (att.codingSubmissions || []).length,
        warningsCount,
        latestSnapshot,
        lastActiveAt: att.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      assessment: {
        id: exam._id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        status: exam.status,
      },
      activeCount: activeStudents.filter((s) => s.status === 'started').length,
      submittedCount: activeStudents.filter((s) => s.status !== 'started').length,
      students: activeStudents,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Faculty Force Submit or Terminate a student's attempt in real-time
// @route   POST /api/assessments/:assessmentId/terminate-student
// @access  Private (Faculty, Admin)
exports.forceTerminateStudentAttempt = async (req, res, next) => {
  try {
    const { attemptId, reason = 'Faculty Terminated Attempt' } = req.body;

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Student attempt session not found' });
    }

    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.antiCheatLogs.push({
      eventType: 'faculty_terminate',
      timestamp: new Date(),
      metadata: reason,
    });

    await attempt.save();

    res.status(200).json({
      success: true,
      message: `Student attempt terminated and submitted successfully. Reason: ${reason}`,
      attempt,
    });
  } catch (err) {
    next(err);
  }
};
