const { body, validationResult } = require('express-validator');

module.exports = (create = false) => {
  const field = name => create ? body(name) : body(name).optional();
  return [
    field('title').isString().bail().trim().isLength({ min: 1, max: 200 }).withMessage('Exam title is required and must be at most 200 characters'),
    field('duration').isFloat({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
    field('startDate').isISO8601().withMessage('A valid start date is required'),
    field('endDate').isISO8601().withMessage('A valid end date is required'),
    body('totalMarks').optional().isFloat({ min: 0.01 }).withMessage('Total marks must be greater than zero'),
    body('passingMarks').optional().isFloat({ min: 0 }).withMessage('Passing marks cannot be negative'),
    body('maxAttempts').optional().isInt({ min: 0 }).withMessage('Maximum attempts must be a nonnegative integer'),
    body('questions').optional().isArray().withMessage('Questions must be an array'),
    body('codingProblems').optional().isArray().withMessage('Coding problems must be an array'),
    body('targetGroups').optional().isArray().withMessage('Target groups must be an array'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
      if (req.body.startDate && req.body.endDate && new Date(req.body.endDate) <= new Date(req.body.startDate)) return res.status(400).json({ success: false, message: 'End date must be after start date' });
      if (req.body.totalMarks !== undefined && req.body.passingMarks !== undefined && Number(req.body.passingMarks) > Number(req.body.totalMarks)) return res.status(400).json({ success: false, message: 'Passing marks cannot exceed total marks' });
      next();
    },
  ];
};
