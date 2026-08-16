const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', required: true },
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    issueDate: { type: Date, default: Date.now },
    verificationUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
