const mongoose = require('mongoose');

const interviewAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
    categoryId: { type: String, default: '' },
    categoryTitle: { type: String, default: '' },
    sourceType: { type: String, enum: ['question', 'coding', 'custom'], default: 'custom' },
    sourceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'sourceModel' },
    sourceModel: { type: String, enum: ['Question', 'CodingProblem'] },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    score: { type: Number, default: 0 },
    metrics: {
      clarity: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      specificity: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
    },
    strengths: { type: [String], default: [] },
    improvementTips: { type: [String], default: [] },
    keyTerms: { type: [String], default: [] },
    inputMode: { type: String, enum: ['text', 'voice'], default: 'text' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewAttempt', interviewAttemptSchema);
