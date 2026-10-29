const { body, validationResult } = require('express-validator');
module.exports = [
  ...['name', 'domain', 'logoUrl', 'address', 'contactEmail', 'contactPhone'].map(field => body(field).optional().isString().withMessage(`${field} must be text`)),
  body('contactEmail').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid contact email'),
  body('logoUrl').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Enter a valid logo URL'),
  body('settings').optional().isObject({ strict: true }).withMessage('Settings must be an object'),
  ...['settings.allowSelfRegistration', 'settings.requireInviteCode', 'isActive'].map(field => body(field).optional().isBoolean({ strict: true }).withMessage(`${field} must be true or false`)),
  (req, res, next) => { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg }); next(); },
];
