const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    college: { type: String, default: 'Engineering College' },
    course: { type: String, default: 'Computer Science' },
    branch: { type: String, default: 'CSE' },
    semester: { type: String, default: '6th' },
    rollNumber: { type: String, default: '' },
    cgpa: { type: String, default: '' },
    dateOfBirth: { type: Date },
    skills: [{ type: String }],
    projects: [
      {
        title: String,
        description: String,
        techStack: String,
        githubUrl: String,
        liveUrl: String,
      },
    ],
    experience: [
      {
        company: String,
        role: String,
        duration: String,
        description: String,
      },
    ],
    resumeUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
