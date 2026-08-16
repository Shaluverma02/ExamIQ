const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    department: { type: String, default: 'Computer Science & Engineering' },
    designation: { type: String, default: 'Assistant Professor' },
    employeeId: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
