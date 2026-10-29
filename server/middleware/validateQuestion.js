const { body, validationResult } = require('express-validator');

module.exports = (create = false) => {
  const field = name => create ? body(name) : body(name).optional();
  return [
    field('questionText').isString().bail().trim().notEmpty().withMessage('Question text is required'),
    field('options').isArray({ min: 2, max: 20 }).withMessage('Provide between 2 and 20 options'),
    body('options.*.optionText').isString().bail().trim().notEmpty().withMessage('Every option needs text'),
    body('options.*.isCorrect').optional().isBoolean({ strict: true }).withMessage('Correct answer flags must be true or false'),
    body('marks').optional().isFloat({ min: 0.01 }).withMessage('Marks must be greater than zero'),
    body('negativeMarks').optional().isFloat({ min: 0 }).withMessage('Negative marking cannot be negative'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
      if (req.body.options && !req.body.options.some(option => option.isCorrect === true)) return res.status(400).json({ success: false, message: 'Select at least one correct answer' });
      const type = req.body.questionType || (create ? 'single' : null);
      if (req.body.options && ['single', 'boolean'].includes(type) && req.body.options.filter(option => option.isCorrect).length !== 1) return res.status(400).json({ success: false, message: 'Select exactly one correct answer for this question type' });
      if (req.body.options && type === 'boolean' && req.body.options.length !== 2) return res.status(400).json({ success: false, message: 'True/false questions require two options' });
      next();
    },
  ];
};
