const mongoose = require('mongoose');

const hiringDriveSchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
    name: { type: String, required: true, trim: true },
    assessmentType: { type: String, enum: ['coding', 'mcq', 'combined'], default: 'coding' },
    batch: { type: String, default: 'All eligible batches', trim: true },
    brief: { type: String, default: '', trim: true },
    status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
    eligibility: {
      minimumScore: { type: Number, default: 70, min: 0, max: 100 },
      minimumCgpa: { type: Number, default: 7, min: 0, max: 10 },
      requiredSkill: { type: String, default: '', trim: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HiringDrive', hiringDriveSchema);
