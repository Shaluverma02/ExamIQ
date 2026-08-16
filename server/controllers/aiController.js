const { generateAIQuestions, analyzeAICode } = require('../services/aiService');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const TestCase = require('../models/TestCase');

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
      count: count || 3
    });

    let savedItems = [];
    if (autoSave) {
      if (type === 'coding') {
        for (const problemData of items) {
          const problem = await CodingProblem.create({
            ...problemData,
            createdBy: req.user._id
          });
          if (problemData.testCases && problemData.testCases.length > 0) {
            const testCaseDocs = problemData.testCases.map(tc => ({
              ...tc,
              problemId: problem._id
            }));
            await TestCase.insertMany(testCaseDocs);
          }
          savedItems.push(problem);
        }
      } else {
        const questionDocs = items.map(q => ({
          ...q,
          createdBy: req.user._id
        }));
        savedItems = await Question.insertMany(questionDocs);
      }
    }

    res.status(200).json({
      success: true,
      count: items.length,
      autoSaved: !!autoSave,
      items,
      savedItems
    });
  } catch (err) {
    next(err);
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
      testResults
    });

    res.status(200).json({
      success: true,
      analysis
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

    const weakTopics = wrongTopics.length > 0 ? wrongTopics : ['Time & Space Complexity Analysis', 'Recursion & Edge Case Handling'];
    const strongTopics = ['Basic Syntax & Logical Control', 'Database Queries'];

    const roadmap = {
      overallSummary: `You scored ${percentage || 75}% in ${examTitle || 'your assessment'}. Focus on mastering key weak areas to achieve top placement readiness.`,
      weakTopics,
      strongTopics,
      dailyPlan: [
        { day: 'Day 1-2', focus: weakTopics[0] || 'Core Concepts', activity: 'Review fundamental theory and solve 5 easy practice problems.' },
        { day: 'Day 3-4', focus: weakTopics[1] || 'Data Structures', activity: 'Practice medium-level coding questions and trace variable states step-by-step.' },
        { day: 'Day 5-6', focus: 'Timed Mock Practice', activity: 'Attempt 2 timed practice quizzes without referencing external hints.' },
        { day: 'Day 7', focus: 'Final Comprehensive Review', activity: 'Re-test previously wrong questions to verify 100% conceptual mastery.' },
      ],
    };

    res.status(200).json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
};
