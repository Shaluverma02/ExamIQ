const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'college_admin', 'admin', 'recruiter'],
      default: 'student',
    },
    phone: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    collegeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
      },
    ],
    activeCollegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerificationCodeHash: String,
    phoneVerificationExpire: Date,
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    magicToken: String,
    magicTokenExpire: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
