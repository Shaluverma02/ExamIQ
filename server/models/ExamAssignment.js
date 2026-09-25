const mongoose = require('mongoose');

const examAssignmentSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    assignmentType: {
      type: String,
      enum: ['group', 'individual', 'mixed'],
      default: 'group',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      min: 1,
    },
    attemptsAllowed: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

examAssignmentSchema.index({ examId: 1 });
examAssignmentSchema.index({ groupIds: 1 });
examAssignmentSchema.index({ studentIds: 1 });
examAssignmentSchema.index({ facultyId: 1 });
examAssignmentSchema.index({ status: 1 });
examAssignmentSchema.index(
  { examId: 1, facultyId: 1, groupIds: 1 },
  { unique: true, partialFilterExpression: { 'groupIds.0': { $exists: true } } }
);

module.exports = mongoose.model('ExamAssignment', examAssignmentSchema);
