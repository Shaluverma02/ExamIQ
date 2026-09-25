const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    role: {
      type: String,
      enum: ['student', 'faculty', 'college_admin', 'admin', 'recruiter'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, collegeId: 1 }, { unique: true });

module.exports = mongoose.model('Membership', membershipSchema);
