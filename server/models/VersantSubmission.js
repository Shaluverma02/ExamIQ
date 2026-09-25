const mongoose = require('mongoose');

const versantSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
    sectionId: { type: String, required: true },
    sectionLabel: { type: String, required: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    scores: {
      fluency: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
      vocabulary: { type: Number, default: 0 },
    },
    overallScore: { type: Number, default: 0 },
    feedback: { type: [String], default: [] },
    metrics: {
      wordCount: { type: Number, default: 0 },
      sentenceCount: { type: Number, default: 0 },
      uniqueWordRatio: { type: Number, default: 0 },
      promptCoverage: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VersantSubmission', versantSubmissionSchema);
