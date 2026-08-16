const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Group code is required'],
      uppercase: true,
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      default: 'Engineering College',
    },
    course: {
      type: String,
      trim: true,
      default: 'General',
    },
    department: {
      type: String,
      trim: true,
      default: 'Computer Science',
    },
    semester: {
      type: String,
      trim: true,
      default: '1st',
    },
    section: {
      type: String,
      trim: true,
      default: 'A',
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2025-2026',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate group code within the SAME college
groupSchema.index({ college: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Group', groupSchema);
