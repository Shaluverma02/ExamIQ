const AuditLog = require('../models/AuditLog');

const logAudit = (action, resource) => {
  return async (req, res, next) => {
    // Record log after request is completed or before next
    const originalSend = res.send;
    res.send = function (data) {
      if (req.user) {
        AuditLog.create({
          userId: req.user._id,
          collegeId: req.collegeId || null,
          role: req.user.role,
          action,
          resource,
          resourceId: req.params.id || req.body.id || '',
          ipAddress: req.ip || req.connection.remoteAddress || '',
          metadata: {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
          },
        }).catch((err) => console.error('AuditLog Creation Error:', err));
      }
      return originalSend.apply(res, arguments);
    };
    next();
  };
};

module.exports = logAudit;
