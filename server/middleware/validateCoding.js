const { body, validationResult } = require('express-validator');

exports.execution = [
  body('language').isString().withMessage('Language must be text'),
  body('sourceCode').isString().bail().isLength({ min: 1, max: 200000 }).withMessage('Source code is required and must be under 200000 characters'),
  body('input').optional().isString().withMessage('Input must be text'),
  body('timeLimit').optional().isFloat({ min: 0.01, max: 10000 }).withMessage('Invalid execution time limit'),
  body('memoryLimit').optional().isFloat({ min: 1, max: 1024 }).withMessage('Memory limit must be between 1 and 1024 MB'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    next();
  },
];
