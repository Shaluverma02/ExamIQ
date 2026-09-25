const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
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
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    college: { type: String, default: '' },
    course: { type: String, default: '' },
    branch: { type: String, default: '' },
    semester: { type: String, default: '' },
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
