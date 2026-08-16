const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'unknown' },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
