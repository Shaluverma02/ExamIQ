const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    domain: { type: String, lowercase: true, trim: true, default: '' },
    logoUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    contactEmail: { type: String, lowercase: true, trim: true, default: '' },
    contactPhone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    settings: {
      allowSelfRegistration: { type: Boolean, default: true },
      requireInviteCode: { type: Boolean, default: false },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

collegeSchema.index({ name: 1 });
collegeSchema.index({ domain: 1 });

module.exports = mongoose.model('College', collegeSchema);
