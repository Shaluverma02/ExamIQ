const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    testInstructions: { type: String, trim: true, default: '', maxlength: 3000 },
    category: { type: String, default: 'General' },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    sectionAssignments: [{
      _id: false,
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
      section: { type: String, enum: ['aptitude', 'reasoning', 'verbal', 'general'], required: true },
    }],
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
    resultReleaseMode: { type: String, enum: ['manual', 'delay', 'immediate'], default: 'manual' },
    resultReleaseDelayHours: { type: Number, min: 0, max: 8760, default: 24 },
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
