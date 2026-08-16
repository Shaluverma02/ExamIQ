const ExamAttempt = require('../models/ExamAttempt');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// In-memory active live stream registry for real-time faculty proctoring
const liveProctorSessions = new Map();

// @desc    Candidate posts live proctor heartbeat/snapshot
// @route   POST /api/proctor/heartbeat
// @access  Private (Student)
exports.postHeartbeat = async (req, res, next) => {
  try {
    const { examId, snapshot, status, audioLevel, violationCount } = req.body;
    const userId = req.user._id.toString();

    liveProctorSessions.set(`${examId}_${userId}`, {
      userId,
      studentName: req.user.name,
      studentEmail: req.user.email,
      examId,
      snapshot: snapshot || '',
      status: status || 'Active',
      audioLevel: audioLevel || 0,
      violationCount: violationCount || 0,
      lastSeen: Date.now(),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @desc    Faculty fetches active live proctored sessions for an exam
// @route   GET /api/proctor/live-sessions/:examId
// @access  Private (Faculty, Admin)
exports.getLiveSessions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const now = Date.now();

    // Fetch active attempts from DB
    const attempts = await ExamAttempt.find({ examId, status: 'in-progress' })
      .populate('userId', 'name email role')
      .lean();

    const sessions = attempts.map((att) => {
      const uId = att.userId?._id?.toString() || att.userId?.toString();
      const liveData = liveProctorSessions.get(`${examId}_${uId}`) || {};
      const isOnline = liveData.lastSeen ? now - liveData.lastSeen < 15000 : false;

      return {
        attemptId: att._id,
        userId: att.userId,
        examId: att.examId,
        studentName: att.userId?.name || 'Candidate',
        studentEmail: att.userId?.email || '',
        status: isOnline ? 'Live Online' : 'Offline / Idle',
        isOnline,
        snapshot: liveData.snapshot || '',
        audioLevel: liveData.audioLevel || 0,
        violationCount: att.violations?.length || liveData.violationCount || 0,
        violations: att.violations || [],
        startedAt: att.startedAt,
        remainingTime: att.remainingTime,
      };
    });

    res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    next(err);
  }
};

// @desc    Faculty sends a direct warning message to candidate
// @route   POST /api/proctor/send-warning
// @access  Private (Faculty, Admin)
exports.sendWarning = async (req, res, next) => {
  try {
    const { examId, userId, message } = req.body;

    await AuditLog.create({
      userId,
      action: 'FACULTY_PROCTOR_WARNING',
      details: message || 'Official warning issued by faculty proctor',
    });

    res.status(200).json({ success: true, message: 'Warning dispatched to candidate' });
  } catch (err) {
    next(err);
  }
};
