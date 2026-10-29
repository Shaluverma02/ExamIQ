const { body, validationResult } = require('express-validator');

const email = () => body('email').isString().withMessage('Email must be text').bail().trim().isEmail().withMessage('A valid email is required').bail().toLowerCase();
const password = () => body('password').isString().withMessage('Password must be text').bail().isLength({ min: 6, max: 72 }).withMessage('Password must be 6 to 72 characters').bail().custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password is too long');
const finish = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  next();
};

exports.register = [
  email(), password(),
  body('name').isString().bail().trim().isLength({ min: 1, max: 120 }).withMessage('Name is required and must be at most 120 characters'),
  body('collegeId').isMongoId().withMessage('Select a valid registered college'),
  body('groupId').optional({ values: 'falsy' }).isMongoId().withMessage('Select a valid group'),
  body('phone').optional({ values: 'falsy' }).isString().bail().matches(/^\+?[0-9\s()-]{7,20}$/).withMessage('Enter a valid mobile number'),
  finish,
];
exports.login = [email(), body('password').isString().bail().notEmpty().withMessage('Password is required'), finish];
exports.email = [email(), finish];
exports.reset = [password(), body('password').custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password is too long'), finish];
exports.phone = [email(), body('code').isString().bail().matches(/^\d{6}$/).withMessage('Enter the six-digit verification code'), finish];
exports.changePassword = [
  body('currentPassword').isString().bail().notEmpty().withMessage('Current password is required'),
  body('newPassword').isString().bail().isLength({ min: 6, max: 72 }).withMessage('New password must be 6 to 72 characters').bail().custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('New password is too long'),
  body('confirmPassword').isString().bail().custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match'),
  finish,
];
exports.profile = [
  body('name').optional().isString().bail().trim().isLength({ min: 1, max: 120 }).withMessage('Name is required and must be at most 120 characters'),
  body('phone').optional({ values: 'falsy' }).isString().bail().matches(/^\+?[0-9\s()-]{7,20}$/).withMessage('Enter a valid mobile number'),
  ...['course', 'branch', 'semester', 'rollNumber', 'department', 'designation'].map(field => body(field).optional().isString().withMessage(`${field} must be text`)),
  body('skills').optional().custom(value => typeof value === 'string' || Array.isArray(value) && value.every(item => typeof item === 'string')).withMessage('Skills must be text or an array of text'),
  ...['projects', 'experience'].map(field => body(field).optional().isArray().withMessage(`${field} must be an array`)),
  ...['resumeUrl', 'linkedinUrl', 'githubUrl', 'portfolioUrl'].map(field => body(field).optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage(`${field} must be a valid http or https URL`)),
  finish,
];
