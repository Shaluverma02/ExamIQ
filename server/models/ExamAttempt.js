const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOptions: [{ type: String }],
  isMarkedForReview: { type: Boolean, default: false },
  isVisited: { type: Boolean, default: false },
  isCorrect: { type: Boolean },
  marksObtained: { type: Number, default: 0 },
});

const antiCheatEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['tab_switch', 'fullscreen_exit', 'copy_paste', 'focus_lost'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: String, default: '' },
  snapshot: { type: String, default: '' }, // base64 encoded screenshot at violation time
});

const examAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    attemptNumber: { type: Number, default: 1 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    remainingTime: { type: Number }, // in seconds
    status: {
      type: String,
      enum: ['started', 'submitted', 'auto-submitted', 'evaluated'],
      default: 'started',
    },
    answers: [answerSchema],
    codingSubmissions: [
      {
        problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' },
        submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingSubmission' },
        status: { type: String },
        score: { type: Number, default: 0 },
      },
    ],
    antiCheatLogs: [antiCheatEventSchema],
  },
  { timestamps: true }
);

examAttemptSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
