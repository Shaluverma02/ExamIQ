const CodingSubmission = require('../models/CodingSubmission');

/**
 * Tokenize code string by removing comments, whitespace, and normalizing syntax
 */
const tokenizeCode = (code = '') => {
  const clean = code
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove comments
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
  
  // Split into structural tokens
  return clean.match(/[a-zA-Z_$][a-zA-Z0-9_$]*|[^\s\w]/g) || [];
};

/**
 * Calculate Jaccard Similarity between two token sets
 */
const calculateJaccardSimilarity = (tokensA, tokensB) => {
  if (!tokensA.length || !tokensB.length) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : (intersection / union) * 100;
};

/**
 * Calculate normalized Levenshtein distance similarity
 */
const calculateLevenshteinSimilarity = (strA = '', strB = '') => {
  const a = strA.replace(/\s+/g, '');
  const b = strB.replace(/\s+/g, '');

  if (!a.length && !b.length) return 100;
  if (!a.length || !b.length) return 0;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return Math.round((1 - distance / maxLen) * 100);
};

/**
 * Calculate overall code similarity score (0 to 100%)
 */
const calculateSimilarity = (codeA, codeB) => {
  const tokensA = tokenizeCode(codeA);
  const tokensB = tokenizeCode(codeB);

  const jaccard = calculateJaccardSimilarity(tokensA, tokensB);
  const lev = calculateLevenshteinSimilarity(codeA, codeB);

  // Weighted average: 60% Jaccard Token Match, 40% Structural Levenshtein
  const combined = Math.round(jaccard * 0.6 + lev * 0.4);
  return Math.min(Math.max(combined, 0), 100);
};

/**
 * Perform exam-wide pairwise plagiarism audit
 */
exports.generateExamPlagiarismReport = async (examId) => {
  const query = examId ? { examId } : {};

  // Fetch all coding submissions
  const submissions = await CodingSubmission.find(query)
    .populate('studentId', 'name email')
    .populate('problemId', 'title')
    .sort({ createdAt: -1 });

  const pairs = [];
  const processed = new Set();

  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const subA = submissions[i];
      const subB = submissions[j];

      // Only compare submissions by different students for the same problem
      if (
        subA.studentId &&
        subB.studentId &&
        subA.studentId._id.toString() !== subB.studentId._id.toString() &&
        subA.problemId &&
        subB.problemId &&
        subA.problemId._id.toString() === subB.problemId._id.toString()
      ) {
        const pairKey = [subA._id, subB._id].sort().join('_');
        if (!processed.has(pairKey)) {
          processed.add(pairKey);

          const similarityScore = calculateSimilarity(subA.sourceCode, subB.sourceCode);
          let riskLevel = 'Low';
          if (similarityScore >= 70) riskLevel = 'High';
          else if (similarityScore >= 40) riskLevel = 'Medium';

          pairs.push({
            pairId: pairKey,
            problemTitle: subA.problemId.title,
            studentA: {
              id: subA.studentId._id,
              name: subA.studentId.name,
              email: subA.studentId.email,
              submissionId: subA._id,
              code: subA.sourceCode,
              language: subA.language,
              submittedAt: subA.submittedAt,
            },
            studentB: {
              id: subB.studentId._id,
              name: subB.studentId.name,
              email: subB.studentId.email,
              submissionId: subB._id,
              code: subB.sourceCode,
              language: subB.language,
              submittedAt: subB.submittedAt,
            },
            similarityScore,
            riskLevel,
          });
        }
      }
    }
  }

  // Sort pairs by highest similarity score first
  pairs.sort((a, b) => b.similarityScore - a.similarityScore);

  const highRiskCount = pairs.filter((p) => p.riskLevel === 'High').length;
  const mediumRiskCount = pairs.filter((p) => p.riskLevel === 'Medium').length;

  return {
    totalSubmissionsScanned: submissions.length,
    totalPairsAnalyzed: pairs.length,
    highRiskCount,
    mediumRiskCount,
    pairs,
  };
};

exports.calculateSimilarity = calculateSimilarity;
