const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

courseSchema.index({ collegeId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
