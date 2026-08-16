const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  optionText: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: [optionSchema],
    questionType: {
      type: String,
      enum: ['single', 'multiple', 'boolean'],
      default: 'single',
    },
    marks: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    category: { type: String, required: true, default: 'General' },
    topic: { type: String, default: 'General' },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    explanation: { type: String, default: '' },
    tags: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
