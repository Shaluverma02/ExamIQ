const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    codingProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' }],
    targetGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    duration: { type: Number, required: true }, // in minutes
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    negativeMarking: { type: Boolean, default: false },
    randomQuestions: { type: Boolean, default: false },
    randomOptions: { type: Boolean, default: false },
    allowRetake: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 3 }, // 0 or null means unlimited attempts
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
