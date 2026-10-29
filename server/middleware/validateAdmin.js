const { body, validationResult } = require('express-validator');
exports.faculty = [
  body('name').isString().bail().trim().isLength({ min: 1, max: 120 }).withMessage('Faculty name is required'),
  body('email').isString().bail().trim().isEmail().withMessage('A valid email is required').bail().toLowerCase(),
  body('password').isString().bail().isLength({ min: 6, max: 72 }).withMessage('Password must be 6 to 72 characters').bail().custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password is too long'),
  ...['department', 'designation', 'employeeId', 'phone'].map(field => body(field).optional().isString().bail().trim().isLength({ max: 120 }).withMessage(`${field} must be text under 120 characters`)),
  body('phone').optional().custom(value => !value || /^\+?[\d\s()-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15).withMessage('Enter a valid phone number'),
  (req, res, next) => { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg }); next(); },
];

exports.collegeAdmin = [
  body('name').isString().bail().trim().isLength({ min: 1, max: 120 }).withMessage('Administrator name is required'),
  body('email').isString().bail().trim().isEmail().withMessage('A valid email is required').bail().toLowerCase(),
  body('password').isString().bail().isLength({ min: 6, max: 72 }).withMessage('Password must be 6 to 72 characters').bail().custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password is too long'),
  body('collegeId').isMongoId().withMessage('Select a valid college'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    next();
  },
];
exports.student = [
  ...exports.faculty,
  ...['rollNumber', 'course', 'branch', 'semester'].map(field => body(field).optional().isString().bail().trim().isLength({ max: 120 }).withMessage(`${field} must be text under 120 characters`)),
  (req, res, next) => { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg }); next(); },
];
