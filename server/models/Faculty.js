const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      index: true,
    },
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    employeeId: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
