const CodingSubmission = require('../models/CodingSubmission');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const User = require('../models/User');

/**
 * Compute Jaccard / Levenshtein Tokenized Similarity Index (0 to 100%)
 */
const calculateCodeSimilarity = (codeA = '', codeB = '') => {
  if (!codeA || !codeB) return 0;

  const tokenize = (src) =>
    src
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // strip comments
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ');

  const tokensA = tokenize(codeA);
  const tokensB = tokenize(codeB);

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 0;
  const similarity = Math.round((intersection.size / union.size) * 100);
  return similarity;
};

// @desc    Analyze Code Plagiarism / Similarity across student submissions for an assessment
// @route   GET /api/assessments/:assessmentId/plagiarism
// @access  Private (Faculty, Admin)
exports.analyzeAssessmentPlagiarism = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const exam = await Exam.findOne({ _id: assessmentId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    if (req.user.role === 'faculty' && exam.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to inspect this assessment' });
    }

    // Fetch all submissions for this exam
    const submissions = await CodingSubmission.find({ examId: assessmentId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .populate('studentId', 'name email rollNumber')
      .populate('problemId', 'title')
      .sort({ createdAt: -1 });

    const similarityPairs = [];

    // Pairwise comparison
    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const subA = submissions[i];
        const subB = submissions[j];

        // Only compare submissions for the SAME student/problem if different students
        if (
          subA.studentId &&
          subB.studentId &&
          subA.studentId._id.toString() !== subB.studentId._id.toString() &&
          subA.problemId &&
          subB.problemId &&
          subA.problemId._id.toString() === subB.problemId._id.toString()
        ) {
          const score = calculateCodeSimilarity(subA.sourceCode, subB.sourceCode);

          if (score >= 40) {
            similarityPairs.push({
              id: `${subA._id}_${subB._id}`,
              problemTitle: subA.problemId?.title || 'Coding Problem',
              similarityScore: score,
              status: score >= 80 ? 'High Risk' : score >= 60 ? 'Medium Risk' : 'Low Risk',
              studentA: {
                id: subA.studentId._id,
                name: subA.studentId.name,
                email: subA.studentId.email,
                code: subA.sourceCode,
                submittedAt: subA.createdAt,
              },
              studentB: {
                id: subB.studentId._id,
                name: subB.studentId.name,
                email: subB.studentId.email,
                code: subB.sourceCode,
                submittedAt: subB.createdAt,
              },
            });
          }
        }
      }
    }

    similarityPairs.sort((a, b) => b.similarityScore - a.similarityScore);

    res.status(200).json({
      success: true,
      assessmentTitle: exam.title,
      totalSubmissions: submissions.length,
      flaggedCount: similarityPairs.length,
      pairs: similarityPairs,
    });
  } catch (err) {
    next(err);
  }
};
