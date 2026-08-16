const ExamAttempt = require('../models/ExamAttempt');

// @desc    Get anti-cheat proctoring audit log for exam attempts
// @route   GET /api/anti-cheat/exam/:examId
// @access  Private (Faculty, Admin)
exports.getExamAntiCheatAudit = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const query = examId === 'all' ? {} : { examId };

    const attempts = await ExamAttempt.find(query)
      .populate('studentId', 'name email')
      .populate('examId', 'title duration')
      .sort({ createdAt: -1 });

    const auditList = attempts.map((attempt) => {
      const logs = attempt.antiCheatLogs || [];
      const tabSwitches = logs.filter((l) => l.eventType === 'tab_switch').length;
      const fullscreenExits = logs.filter((l) => l.eventType === 'fullscreen_exit').length;
      const copyPastes = logs.filter((l) => l.eventType === 'copy_paste').length;
      const focusLost = logs.filter((l) => l.eventType === 'focus_lost').length;
      const totalViolations = logs.length;

      let riskStatus = 'Clean';
      if (totalViolations >= 5 || tabSwitches >= 3) riskStatus = 'High Violation Risk';
      else if (totalViolations >= 2) riskStatus = 'Moderate Warning';

      return {
        attemptId: attempt._id,
        studentName: attempt.studentId ? attempt.studentId.name : 'Unknown Student',
        studentEmail: attempt.studentId ? attempt.studentId.email : '',
        examTitle: attempt.examId ? attempt.examId.title : 'Assessment',
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        metrics: {
          totalViolations,
          tabSwitches,
          fullscreenExits,
          copyPastes,
          focusLost,
        },
        riskStatus,
        logs,
      };
    });

    // Sort by highest total violations first
    auditList.sort((a, b) => b.metrics.totalViolations - a.metrics.totalViolations);

    res.status(200).json({
      success: true,
      count: auditList.length,
      auditList,
    });
  } catch (err) {
    next(err);
  }
};
