const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
};

exports.getOverview = async (req, res, next) => {
  try {
    const [
      activeStudents,
      activeFaculty,
      publishedExams,
      submissions,
      averageScoreRows,
      recentAssessments,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'faculty', isActive: true }),
      Exam.countDocuments({ status: 'published' }),
      Result.countDocuments({}),
      Result.aggregate([
        { $group: { _id: null, average: { $avg: '$percentage' } } },
      ]),
      Exam.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title category duration totalMarks endDate')
        .lean(),
    ]);

    const averageScore = averageScoreRows[0]?.average || 0;

    res.status(200).json({
      success: true,
      stats: [
        { label: 'Active Students', value: activeStudents },
        { label: 'Faculty', value: activeFaculty },
        { label: 'Published Exams', value: publishedExams },
        { label: 'Avg Score', value: formatPercent(averageScore) },
      ],
      totals: {
        activeStudents,
        activeFaculty,
        publishedExams,
        submissions,
        averageScore: Math.round(averageScore),
      },
      recentAssessments: recentAssessments.map((exam) => ({
        id: exam._id,
        title: exam.title,
        category: exam.category || 'General',
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        status: new Date(exam.endDate) >= new Date() ? 'Open' : 'Closed',
      })),
    });
  } catch (err) {
    next(err);
  }
};
