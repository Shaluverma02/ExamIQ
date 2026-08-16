const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt', required: true },
    attemptNumber: { type: Number, default: 1 },
    objectiveScore: { type: Number, default: 0 },
    codingScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    skippedAnswers: { type: Number, default: 0 },
    attemptedQuestions: { type: Number, default: 0 },
    status: { type: String, enum: ['Pass', 'Fail'], default: 'Fail' },
    rank: { type: Number, default: 0 },
    evaluatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resultSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 });

module.exports = mongoose.model('Result', resultSchema);
