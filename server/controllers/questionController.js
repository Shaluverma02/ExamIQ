const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const TestCase = require('../models/TestCase');

// @desc    Get all questions (with filters)
// @route   GET /api/questions
// @access  Private (Faculty, Admin)
exports.getQuestions = async (req, res, next) => {
  try {
    const { category, difficulty, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.questionText = { $regex: search, $options: 'i' };
    }

    // Faculty only sees their own questions or public ones
    if (req.user.role === 'faculty') {
      query.createdBy = req.user._id;
    }

    const count = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      questions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new question
// @route   POST /api/questions
// @access  Private (Faculty, Admin)
exports.createQuestion = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    const question = await Question.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get question by ID
// @route   GET /api/questions/:id
// @access  Private
exports.getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, question });
  } catch (err) {
    next(err);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Faculty, Admin)
exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this question' });
    }

    question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Question updated successfully', question });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Faculty, Admin)
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this question' });
    }

    await question.deleteOne();
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Helper to validate & normalize a single question item from JSON
const validateAndNormalizeQuestion = (item) => {
  const errors = [];

  const rawType = (item.questionType || item.type || 'single').toString().toLowerCase().trim();

  // 0. Coding Problem Check
  if (rawType === 'coding' || item.isCoding || Array.isArray(item.testCases)) {
    const title = (item.title || item.question || item.questionText || '').toString().trim();
    const description = (item.description || item.questionText || item.question || '').toString().trim();

    if (!title || !description) {
      errors.push('Coding problem requires title and description');
      return { valid: false, errors, questionText: title || 'Coding Problem' };
    }

    return {
      valid: true,
      isCoding: true,
      data: {
        title,
        description,
        inputFormat: (item.inputFormat || '').trim(),
        outputFormat: (item.outputFormat || '').trim(),
        constraints: (item.constraints || '').trim(),
        difficulty: ['easy', 'medium', 'hard'].includes((item.difficulty || '').toLowerCase()) ? item.difficulty.toLowerCase() : 'easy',
        category: (item.category || 'Data Structures').trim(),
        topic: (item.topic || 'General').trim(),
        marks: Number(item.marks || 10),
        timeLimit: Number(item.timeLimit || 2),
        memoryLimit: Number(item.memoryLimit || 128),
        allowedLanguages: Array.isArray(item.allowedLanguages) ? item.allowedLanguages : ['javascript', 'python', 'java', 'cpp', 'c'],
        testCases: Array.isArray(item.testCases) ? item.testCases : [],
        starterCode: Array.isArray(item.starterCode) ? item.starterCode : [],
      },
    };
  }

  // Objective Question Check
  const questionText = (item.questionText || item.question || '').toString().trim();
  if (!questionText) {
    errors.push('questionText or question is required');
  }

  // Type mapping
  let questionType = 'single';
  if (['single', 'mcq', 'single_correct'].includes(rawType)) {
    questionType = 'single';
  } else if (['multiple', 'multiple_correct', 'checkbox'].includes(rawType)) {
    questionType = 'multiple';
  } else if (['boolean', 'true_false', 'tf'].includes(rawType)) {
    questionType = 'boolean';
  } else {
    errors.push(`Invalid question type '${rawType}'. Allowed: single, multiple, boolean, coding`);
  }

  // Difficulty mapping
  let difficulty = (item.difficulty || 'easy').toString().toLowerCase().trim();
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    difficulty = 'easy';
  }

  const marks = Number(item.marks !== undefined ? item.marks : 1);
  if (isNaN(marks) || marks < 0) {
    errors.push('marks must be a non-negative number');
  }

  const negativeMarks = Number(item.negativeMarks !== undefined ? item.negativeMarks : 0);
  let options = [];

  if (questionType === 'boolean') {
    let correctVal = item.correctAnswer !== undefined ? item.correctAnswer : item.isCorrect;
    let isTrueCorrect = false;
    if (typeof correctVal === 'boolean') {
      isTrueCorrect = correctVal;
    } else if (typeof correctVal === 'string') {
      isTrueCorrect = ['true', 't', 'yes', '1'].includes(correctVal.toLowerCase().trim());
    }

    options = [
      { optionText: 'True', isCorrect: isTrueCorrect },
      { optionText: 'False', isCorrect: !isTrueCorrect },
    ];
  } else {
    const rawOptions = item.options;
    if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
      errors.push('options must contain at least 2 items');
    } else {
      if (typeof rawOptions[0] === 'string' || typeof rawOptions[0] === 'number') {
        const ca = item.correctAnswer !== undefined ? item.correctAnswer : item.correctOptions;

        if (ca === undefined || ca === null || ca === '') {
          errors.push('correctAnswer is required when options are strings');
        }

        const correctAnswers = Array.isArray(ca)
          ? ca.map((v) => String(v).trim().toLowerCase())
          : [String(ca).trim().toLowerCase()];

        options = rawOptions.map((optStr, i) => {
          const strVal = String(optStr).trim();
          const strValLower = strVal.toLowerCase();
          const isCorrect =
            correctAnswers.includes(strValLower) ||
            correctAnswers.includes(String(i)) ||
            correctAnswers.includes(String(i + 1));

          return { optionText: strVal, isCorrect };
        });

        if (!options.some((o) => o.isCorrect)) {
          errors.push(`correctAnswer '${ca}' did not match any provided options`);
        }
      } else if (typeof rawOptions[0] === 'object' && rawOptions[0] !== null) {
        options = rawOptions.map((optObj) => ({
          optionText: (optObj.optionText || optObj.text || '').trim(),
          isCorrect: !!optObj.isCorrect,
        }));

        if (options.some((o) => !o.optionText)) {
          errors.push('Each option object must contain non-empty optionText');
        }

        if (!options.some((o) => o.isCorrect)) {
          errors.push('At least one option must have isCorrect set to true');
        }
      } else {
        errors.push('options format is invalid');
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, questionText };
  }

  return {
    valid: true,
    data: {
      questionText,
      questionType,
      options,
      marks,
      negativeMarks,
      category: (item.category || 'General').trim(),
      topic: (item.topic || 'General').trim(),
      difficulty,
      explanation: (item.explanation || '').trim(),
      tags: Array.isArray(item.tags) ? item.tags : [],
    },
  };
};

// @desc    Import Questions from JSON
// @route   POST /api/questions/import-json
// @access  Private (Faculty, Admin)
exports.importQuestionsJson = async (req, res, next) => {
  try {
    let rawItems = [];

    // Parse JSON or CSV from file buffer or body
    if (req.file) {
      const fileName = req.file.originalname.toLowerCase();
      const fileContent = req.file.buffer.toString('utf8');

      if (fileName.endsWith('.csv')) {
        try {
          const lines = fileContent.split(/\r?\n/).filter((l) => l.trim() !== '');
          if (lines.length >= 2) {
            const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
            rawItems = lines.slice(1).map((line) => {
              const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
              const obj = {};
              headers.forEach((h, idx) => {
                obj[h] = values[idx] || '';
              });
              if (obj.optionA || obj.optionB) {
                obj.options = [obj.optionA, obj.optionB, obj.optionC, obj.optionD].filter(Boolean);
              }
              return obj;
            });
          }
        } catch (err) {
          return res.status(400).json({ success: false, message: 'Invalid CSV file format' });
        }
      } else if (fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(fileContent);
          if (Array.isArray(parsed)) {
            rawItems = parsed;
          } else if (parsed && Array.isArray(parsed.questions)) {
            rawItems = parsed.questions;
          } else if (parsed && typeof parsed === 'object') {
            rawItems = [parsed];
          }
        } catch (err) {
          return res.status(400).json({ success: false, message: 'Invalid JSON file syntax' });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Only .json and .csv files are supported' });
      }
    } else if (req.body.questions) {
      const parsed = typeof req.body.questions === 'string' ? JSON.parse(req.body.questions) : req.body.questions;
      rawItems = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.questions) ? parsed.questions : [parsed]);
    } else if (Array.isArray(req.body)) {
      rawItems = req.body;
    } else if (req.body && typeof req.body === 'object') {
      rawItems = [req.body];
    } else {
      return res.status(400).json({ success: false, message: 'File (.json / .csv) or questions data is required' });
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ success: false, message: 'File content must be a non-empty array of questions' });
    }

    const skipDuplicates = req.body.skipDuplicates === true || req.body.skipDuplicates === 'true';
    const validateOnly = req.body.validateOnly === true || req.body.validateOnly === 'true';

    // Fetch existing questions for duplicate checking
    const existingQuestions = await Question.find({ createdBy: req.user._id }).select('questionText category topic');
    const existingMap = new Set(
      existingQuestions.map((q) => `${q.questionText.trim().toLowerCase()}|${(q.category || '').trim().toLowerCase()}`)
    );

    const validationResults = [];
    const validQuestionsToSave = [];
    const validCodingToSave = [];
    const errors = [];
    let duplicateCount = 0;
    let validCount = 0;
    let invalidCount = 0;

    rawItems.forEach((item, index) => {
      const result = validateAndNormalizeQuestion(item);
      const qText = result.isCoding ? result.data.title : (result.data ? result.data.questionText : (result.questionText || ''));
      const qCat = result.data ? result.data.category : (item.category || 'General');
      const questionKey = `${qText.trim().toLowerCase()}|${qCat.trim().toLowerCase()}`;
      const isDuplicate = existingMap.has(questionKey);

      if (isDuplicate) {
        duplicateCount++;
      }

      if (result.valid) {
        validCount++;

        validationResults.push({
          index: index + 1,
          questionText: result.isCoding ? result.data.title : result.data.questionText,
          type: result.isCoding ? 'coding' : result.data.questionType,
          difficulty: result.data.difficulty,
          topic: result.data.topic,
          category: result.data.category,
          status: isDuplicate ? 'duplicate' : 'valid',
          message: isDuplicate ? 'Duplicate question detected' : 'Valid',
        });

        if (!isDuplicate || !skipDuplicates) {
          if (result.isCoding) {
            validCodingToSave.push(result.data);
          } else {
            validQuestionsToSave.push({
              ...result.data,
              createdBy: req.user._id,
            });
          }
        }
      } else {
        invalidCount++;
        errors.push({
          index: index + 1,
          questionText: result.questionText || `Question #${index + 1}`,
          message: result.errors.join('; '),
        });

        validationResults.push({
          index: index + 1,
          questionText: result.questionText || `Question #${index + 1}`,
          type: item.type || item.questionType || 'unknown',
          difficulty: item.difficulty || 'unknown',
          topic: item.topic || 'General',
          category: item.category || 'General',
          status: 'invalid',
          message: result.errors.join('; '),
        });
      }
    });

    let insertedQuestions = [];
    let insertedCodingCount = 0;

    if (!validateOnly) {
      if (validQuestionsToSave.length > 0) {
        insertedQuestions = await Question.insertMany(validQuestionsToSave);
      }

      if (validCodingToSave.length > 0) {
        for (const codingItem of validCodingToSave) {
          const testCases = codingItem.testCases || [];
          delete codingItem.testCases;

          const createdProblem = await CodingProblem.create({
            ...codingItem,
            createdBy: req.user._id,
          });

          if (testCases.length > 0) {
            const tcDocs = testCases.map((tc, tcIdx) => ({
              codingProblemId: createdProblem._id,
              problemId: createdProblem._id,
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || tc.output || '',
              isHidden: !!tc.isHidden,
              order: tcIdx + 1,
              weight: tc.weight || 1,
            }));
            await TestCase.insertMany(tcDocs);
          }
          insertedCodingCount++;
        }
      }
    }

    const totalImported = validateOnly ? (validQuestionsToSave.length + validCodingToSave.length) : (insertedQuestions.length + insertedCodingCount);

    res.status(200).json({
      success: true,
      total: rawItems.length,
      imported: totalImported,
      skipped: invalidCount + (skipDuplicates ? duplicateCount : 0),
      validCount,
      invalidCount,
      duplicates: duplicateCount,
      errors,
      preview: validationResults,
    });
  } catch (err) {
    next(err);
  }
};

