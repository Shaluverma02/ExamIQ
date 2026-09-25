const { generateAIQuestions, analyzeAICode } = require('../services/aiService');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const TestCase = require('../models/TestCase');
const Result = require('../models/Result');
const InterviewAttempt = require('../models/InterviewAttempt');
const VersantSubmission = require('../models/VersantSubmission');

const cleanText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const wordsFrom = (value = '') => cleanText(value)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter((word) => word.length > 3);

const unique = (items) => [...new Set(items.filter(Boolean))];

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const makeCategoryId = (value = 'general') => cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'general';

const groupContentByTopic = (questions, problems) => {
  const groups = new Map();

  const ensureGroup = (title, seed) => {
    const normalizedTitle = cleanText(title || 'General');
    const id = makeCategoryId(normalizedTitle);
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        title: normalizedTitle,
        description: `Questions generated from current ${normalizedTitle} content in the question bank and coding library.`,
        questions: [],
        count: 0,
        color: seed % 3 === 0 ? 'primary' : seed % 3 === 1 ? 'success' : 'info',
      });
    }
    return groups.get(id);
  };

  questions.forEach((item, index) => {
    const title = item.topic || item.category || 'General';
    const group = ensureGroup(title, index);
    const text = cleanText(item.explanation)
      ? `${cleanText(item.questionText)} Explain the reasoning behind your answer.`
      : cleanText(item.questionText);

    group.questions.push({
      id: String(item._id),
      text,
      sourceType: 'question',
      sourceId: item._id,
      difficulty: item.difficulty,
    });
  });

  problems.forEach((item, index) => {
    const title = item.topic || item.category || 'Coding';
    const group = ensureGroup(title, questions.length + index);
    group.questions.push({
      id: String(item._id),
      text: `Walk through your approach for "${item.title}". Include data structures, edge cases, time complexity, and space complexity.`,
      sourceType: 'coding',
      sourceId: item._id,
      difficulty: item.difficulty,
    });
  });

  return Array.from(groups.values())
    .map((group) => ({ ...group, count: group.questions.length, questions: group.questions.slice(0, 8) }))
    .filter((group) => group.count > 0)
    .slice(0, 8);
};

const scoreWrittenResponse = ({ prompt, response }) => {
  const answerWords = wordsFrom(response);
  const promptWords = unique(wordsFrom(prompt));
  const uniqueAnswer = unique(answerWords);
  const wordCount = answerWords.length;
  const matchedTerms = promptWords.filter((word) => uniqueAnswer.includes(word));
  const coverage = promptWords.length ? matchedTerms.length / promptWords.length : 0;
  const hasStructure = /\b(first|second|because|therefore|however|finally|complexity|edge|example|tradeoff|approach)\b/i.test(response);
  const sentenceCount = cleanText(response).split(/[.!?]+/).filter((part) => part.trim().length > 0).length;
  const specificity = /\b(o\(|time|space|array|tree|graph|database|index|query|constraint|case|input|output|example|n\b|log)\b/i.test(response) ? 1 : 0;

  const clarity = clamp(Math.min(wordCount / 90, 1) * 35 + Math.min(sentenceCount / 4, 1) * 35 + (hasStructure ? 30 : 10));
  const relevance = clamp(coverage * 70 + Math.min(wordCount / 120, 1) * 30);
  const structure = clamp((hasStructure ? 55 : 20) + Math.min(sentenceCount / 5, 1) * 45);
  const specificScore = clamp(specificity * 55 + Math.min(uniqueAnswer.length / 45, 1) * 45);
  const score = clamp(clarity * 0.25 + relevance * 0.35 + structure * 0.2 + specificScore * 0.2);

  const strengths = [];
  const improvementTips = [];

  if (relevance >= 60) strengths.push('Your answer addresses the main terms in the prompt.');
  else improvementTips.push('Use more terms from the question and connect them to your explanation.');

  if (structure >= 60) strengths.push('Your response has a clear explanation flow.');
  else improvementTips.push('Organize the answer as approach, reasoning, edge cases, and complexity.');

  if (specificScore >= 60) strengths.push('You included technical details instead of staying generic.');
  else improvementTips.push('Add concrete examples, constraints, data structures, or complexity details.');

  if (wordCount < 35) improvementTips.push('Expand the answer so the evaluator can see your reasoning.');
  if (strengths.length === 0) strengths.push('You submitted an answer that can be evaluated and improved.');

  return {
    score,
    metrics: {
      clarity,
      relevance,
      structure,
      specificity: specificScore,
      wordCount,
    },
    strengths,
    improvementTips,
    keyTerms: matchedTerms.slice(0, 8),
  };
};

const buildVersantSections = async (req) => {
  const scoped = req?.collegeId ? { collegeId: req.collegeId } : {};
  const [questions, problems] = await Promise.all([
    Question.find(scoped).sort({ createdAt: -1 }).limit(10).select('questionText category topic explanation').lean(),
    CodingProblem.find({ ...scoped, isActive: true }).sort({ createdAt: -1 }).limit(10).select('title description category topic examples').lean(),
  ]);

  const sections = [];
  const firstQuestion = questions[0];
  const secondQuestion = questions[1] || firstQuestion;
  const firstProblem = problems[0];
  const secondProblem = problems[1] || firstProblem;

  if (firstQuestion) {
    sections.push({
      id: 'listening',
      label: 'Listening Comprehension',
      skill: 'Listening',
      duration: 15,
      prompt: `Listen carefully: ${cleanText(firstQuestion.questionText)} Now summarize the key idea and answer in your own words.`,
      sourceType: 'question',
      sourceId: firstQuestion._id,
    });
  }

  if (secondQuestion) {
    sections.push({
      id: 'reading',
      label: 'Reading and Explanation',
      skill: 'Reading',
      duration: 15,
      prompt: `Read this assessment item and explain it clearly: ${cleanText(secondQuestion.questionText)}`,
      sourceType: 'question',
      sourceId: secondQuestion._id,
    });
  }

  if (firstProblem) {
    sections.push({
      id: 'speaking',
      label: 'Speaking Response',
      skill: 'Speaking',
      duration: 15,
      prompt: `Explain your coding approach for ${firstProblem.title}. Problem context: ${cleanText(firstProblem.description).slice(0, 420)}`,
      sourceType: 'coding',
      sourceId: firstProblem._id,
    });
  }

  if (secondProblem || firstQuestion) {
    const source = secondProblem || firstQuestion;
    sections.push({
      id: 'writing',
      label: 'Written Communication',
      skill: 'Writing',
      duration: 15,
      prompt: secondProblem
        ? `Write a concise technical explanation for ${secondProblem.title}, including input, output, and one edge case.`
        : `Write a concise explanation for this topic: ${cleanText(source.questionText)}`,
      sourceType: secondProblem ? 'coding' : 'question',
      sourceId: source._id,
    });
  }

  return sections;
};

const scoreVersantResponse = ({ prompt, response }) => {
  const answerWords = wordsFrom(response);
  const uniqueWords = unique(answerWords);
  const promptWords = unique(wordsFrom(prompt));
  const matchedTerms = promptWords.filter((word) => uniqueWords.includes(word));
  const wordCount = answerWords.length;
  const sentenceCount = cleanText(response).split(/[.!?]+/).filter((part) => part.trim().length > 0).length;
  const uniqueWordRatio = wordCount ? uniqueWords.length / wordCount : 0;
  const promptCoverage = promptWords.length ? matchedTerms.length / promptWords.length : 0;
  const grammarSignals = /[.!?]$/.test(cleanText(response)) ? 1 : 0;

  const fluency = clamp(Math.min(wordCount / 100, 1) * 55 + Math.min(sentenceCount / 5, 1) * 45);
  const accuracy = clamp(promptCoverage * 80 + Math.min(wordCount / 80, 1) * 20);
  const grammar = clamp(grammarSignals * 35 + Math.min(sentenceCount / 4, 1) * 35 + Math.min(wordCount / 70, 1) * 30);
  const vocabulary = clamp(uniqueWordRatio * 65 + Math.min(uniqueWords.length / 45, 1) * 35);
  const overallScore = clamp((fluency + accuracy + grammar + vocabulary) / 4);

  const feedback = [];
  if (accuracy < 55) feedback.push('Refer to more prompt-specific terms in your response.');
  if (fluency < 55) feedback.push('Add a fuller response with complete sentences.');
  if (grammar < 55) feedback.push('Use complete sentences and punctuation.');
  if (vocabulary < 55) feedback.push('Use varied vocabulary while staying relevant to the prompt.');
  if (feedback.length === 0) feedback.push('Strong response. Keep the same clarity and prompt coverage in the next section.');

  return {
    scores: { fluency, accuracy, grammar, vocabulary },
    overallScore,
    feedback,
    metrics: {
      wordCount,
      sentenceCount,
      uniqueWordRatio: Number(uniqueWordRatio.toFixed(2)),
      promptCoverage: Number(promptCoverage.toFixed(2)),
    },
  };
};

// @desc    Generate questions using AI
// @route   POST /api/ai/generate-questions
// @access  Private (Faculty, Admin)
exports.generateQuestions = async (req, res, next) => {
  try {
    const { topic, category, difficulty, type, count, autoSave } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const items = await generateAIQuestions({
      topic,
      category: category || 'General',
      difficulty: difficulty || 'easy',
      type: type || 'mcq',
      count: count || 3,
    });

    let savedItems = [];
    if (autoSave) {
      if (type === 'coding') {
        for (const problemData of items) {
          const problem = await CodingProblem.create({
            ...problemData,
            createdBy: req.user._id,
            collegeId: req.collegeId || undefined,
          });
          if (problemData.testCases && problemData.testCases.length > 0) {
            const testCaseDocs = problemData.testCases.map((tc) => ({
              ...tc,
              problemId: problem._id,
            }));
            await TestCase.insertMany(testCaseDocs);
          }
          savedItems.push(problem);
        }
      } else {
        const questionDocs = items.map((q) => ({
          ...q,
          createdBy: req.user._id,
          collegeId: req.collegeId || undefined,
        }));
        savedItems = await Question.insertMany(questionDocs);
      }
    }

    res.status(200).json({
      success: true,
      count: items.length,
      autoSaved: !!autoSave,
      items,
      savedItems,
    });
  } catch (err) {
    next(err);
  }
};

exports.saveGeneratedQuestions = async (req, res, next) => {
  try {
    const questions = Array.isArray(req.body.questions) ? req.body.questions : [];
    const codingProblems = Array.isArray(req.body.codingProblems) ? req.body.codingProblems : [];
    const savedQuestions = questions.length
      ? await Question.insertMany(questions.map((item) => ({ ...item, createdBy: req.user._id, collegeId: req.collegeId || undefined })))
      : [];
    const savedProblems = [];
    for (const item of codingProblems) {
      const problem = await CodingProblem.create({ ...item, createdBy: req.user._id, collegeId: req.collegeId || undefined });
      savedProblems.push(problem);
    }
    res.status(201).json({ success: true, message: `${savedQuestions.length + savedProblems.length} generated item(s) saved`, savedQuestions, savedProblems });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze code using AI
// @route   POST /api/ai/analyze-code
// @access  Private
exports.analyzeCode = async (req, res, next) => {
  try {
    const { code, language, problemTitle, problemDescription, testResults } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const analysis = await analyzeAICode({
      code,
      language: language || 'javascript',
      problemTitle,
      problemDescription,
      testResults,
    });

    res.status(200).json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
};

// @desc    Dynamic interview topic feed
// @route   GET /api/ai/interview/topics
// @access  Private
exports.getInterviewTopics = async (req, res, next) => {
  try {
    const [questions, problems, recentAttempts] = await Promise.all([
      Question.find(req.collegeId ? { collegeId: req.collegeId } : {}).sort({ createdAt: -1 }).limit(80).select('questionText category topic difficulty explanation').lean(),
      CodingProblem.find({ ...(req.collegeId ? { collegeId: req.collegeId } : {}), isActive: true }).sort({ createdAt: -1 }).limit(60).select('title description category topic difficulty').lean(),
      InterviewAttempt.find({ userId: req.user._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) }).sort({ createdAt: -1 }).limit(8).select('categoryTitle question score createdAt metrics').lean(),
    ]);

    const topics = groupContentByTopic(questions, problems);

    res.status(200).json({
      success: true,
      topics,
      recentAttempts,
      message: topics.length ? 'Interview topics loaded from question bank.' : 'No question bank or coding content is available yet.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Evaluate interview response
// @route   POST /api/ai/interview/evaluate
// @access  Private
exports.evaluateInterviewAnswer = async (req, res, next) => {
  try {
    const { categoryId, categoryTitle, question, answer, sourceType = 'custom', sourceId, inputMode = 'text' } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    const evaluation = scoreWrittenResponse({ prompt: question, response: answer });
    const sourceModel = sourceType === 'question' ? 'Question' : sourceType === 'coding' ? 'CodingProblem' : undefined;

    const attempt = await InterviewAttempt.create({
      userId: req.user._id,
      collegeId: req.collegeId || undefined,
      categoryId: categoryId || makeCategoryId(categoryTitle || 'custom'),
      categoryTitle: categoryTitle || 'Custom Interview Practice',
      sourceType,
      sourceId: sourceId || undefined,
      sourceModel,
      question,
      answer,
      score: evaluation.score,
      metrics: evaluation.metrics,
      strengths: evaluation.strengths,
      improvementTips: evaluation.improvementTips,
      keyTerms: evaluation.keyTerms,
      inputMode,
    });

    res.status(200).json({
      success: true,
      feedback: {
        attemptId: attempt._id,
        score: evaluation.score,
        clarity: evaluation.metrics.clarity,
        relevance: evaluation.metrics.relevance,
        structure: evaluation.metrics.structure,
        specificity: evaluation.metrics.specificity,
        wordCount: evaluation.metrics.wordCount,
        strengths: evaluation.strengths,
        improvementTips: evaluation.improvementTips,
        keyTerms: evaluation.keyTerms,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Dynamic Versant-style assessment feed
// @route   GET /api/ai/versant/assessment
// @access  Private
exports.getVersantAssessment = async (req, res, next) => {
  try {
    const [sections, recentSubmissions] = await Promise.all([
      buildVersantSections(req),
      VersantSubmission.find({ userId: req.user._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    res.status(200).json({
      success: true,
      sections,
      recentSubmissions,
      message: sections.length ? 'Assessment sections loaded from current exam content.' : 'No question bank or coding content is available yet.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Score and save a Versant-style section response
// @route   POST /api/ai/versant/submit
// @access  Private
exports.submitVersantSection = async (req, res, next) => {
  try {
    const { sectionId, sectionLabel, prompt, response } = req.body;

    if (!sectionId || !sectionLabel || !prompt || !response) {
      return res.status(400).json({ success: false, message: 'Section, prompt and response are required' });
    }

    const scoring = scoreVersantResponse({ prompt, response });
    const submission = await VersantSubmission.create({
      userId: req.user._id,
      collegeId: req.collegeId || undefined,
      sectionId,
      sectionLabel,
      prompt,
      response,
      scores: scoring.scores,
      overallScore: scoring.overallScore,
      feedback: scoring.feedback,
      metrics: scoring.metrics,
    });

    res.status(200).json({
      success: true,
      submissionId: submission._id,
      scores: scoring.scores,
      overallScore: scoring.overallScore,
      feedback: scoring.feedback,
      metrics: scoring.metrics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate AI Study Roadmap & Weak Topic Diagnostic
// @route   POST /api/ai/study-roadmap
// @access  Private (Student)
exports.generateStudyRoadmap = async (req, res, next) => {
  try {
    const { examTitle, score, totalMarks, percentage, wrongTopics = [] } = req.body;

    const resultTopics = unique((wrongTopics || []).map(cleanText));
    const recentResults = await Result.find({ studentId: req.user._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .sort({ evaluatedAt: -1, createdAt: -1 })
      .limit(5)
      .populate('examId', 'title category')
      .lean();

    const inferredWeakTopics = recentResults
      .filter((item) => Number(item.percentage || 0) < 60)
      .map((item) => item.examId?.category || item.examId?.title)
      .filter(Boolean);

    const strongerTopics = recentResults
      .filter((item) => Number(item.percentage || 0) >= 75)
      .map((item) => item.examId?.category || item.examId?.title)
      .filter(Boolean);

    const weakTopics = unique([...resultTopics, ...inferredWeakTopics]);
    const strongTopics = unique(strongerTopics);
    const displayPercentage = Number.isFinite(Number(percentage))
      ? Number(percentage)
      : Number(totalMarks) > 0
        ? Math.round((Number(score || 0) / Number(totalMarks)) * 100)
        : null;

    if (weakTopics.length === 0 && strongTopics.length === 0 && recentResults.length === 0) {
      return res.status(200).json({
        success: true,
        roadmap: {
          overallSummary: 'A personalized roadmap will be available after you complete assessments with evaluated results.',
          weakTopics: [],
          strongTopics: [],
          dailyPlan: [],
        },
      });
    }

    const activeWeakTopics = weakTopics.length ? weakTopics : ['Lowest scoring assessment category'];

    const roadmap = {
      overallSummary: displayPercentage === null
        ? `Roadmap generated from your latest ${recentResults.length} evaluated result(s).`
        : `You scored ${displayPercentage}% in ${examTitle || 'the selected assessment'}. The plan uses your evaluated result history and wrong-topic data.`,
      weakTopics,
      strongTopics,
      dailyPlan: activeWeakTopics.slice(0, 4).map((topic, index) => ({
        day: `Day ${index + 1}`,
        focus: topic,
        activity: `Review mistakes from ${topic}, solve targeted practice questions, and re-check explanations from your result report.`,
      })),
    };

    res.status(200).json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
};
