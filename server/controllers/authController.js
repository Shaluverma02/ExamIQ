const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const sendEmail = require('../utils/sendEmail');

// Helper to generate JWT token
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_exam_platform_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userObj,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      phone,
      college,
      course,
      branch,
      semester,
      rollNumber,
      groupId,
      department,
      designation,
      employeeId,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || '',
      verificationToken,
      isEmailVerified: true, // auto verify for quick demo flow
    });

    if (role === 'student') {
      let assignedGroupId = groupId || null;

      // If groupId is provided, verify group exists
      if (assignedGroupId) {
        const Group = require('../models/Group');
        const targetGroup = await Group.findById(assignedGroupId);
        if (targetGroup) {
          if (!targetGroup.students.includes(user._id)) {
            targetGroup.students.push(user._id);
            await targetGroup.save();
          }
        } else {
          assignedGroupId = null;
        }
      }

      await Student.create({
        userId: user._id,
        groupId: assignedGroupId,
        college: college || 'Engineering College',
        course: course || 'B.Tech CS',
        branch: branch || 'Computer Science',
        semester: semester || '6th',
        rollNumber: rollNumber || `ROLL-${Date.now().toString().slice(-4)}`,
      });
    } else if (role === 'faculty') {
      await Faculty.create({
        userId: user._id,
        department: department || 'Computer Science & Engineering',
        designation: designation || 'Assistant Professor',
        employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
      });
    }

    // Try sending verification email (non-blocking)
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    sendEmail({
      email: user.email,
      subject: 'Welcome to Online Exam Portal - Account Verification',
      message: `Hello ${user.name},\n\nPlease click the link to verify your account:\n${verifyUrl}`,
    }).catch((err) => console.error('Verification email error:', err));

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by administrator',
      });
    }

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let extendedProfile = null;

    if (user.role === 'student') {
      extendedProfile = await Student.findOne({ userId: user._id }).populate('groupId', 'name code college course department semester section');
    } else if (user.role === 'faculty') {
      extendedProfile = await Faculty.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      profile: extendedProfile,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      college,
      course,
      branch,
      semester,
      rollNumber,
      cgpa,
      skills,
      projects,
      experience,
      resumeUrl,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      department,
      designation,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );

    let updatedProfile = null;

    if (user.role === 'student') {
      const parsedSkills = Array.isArray(skills)
        ? skills
        : (skills || '').split(',').map((s) => s.trim()).filter(Boolean);

      updatedProfile = await Student.findOneAndUpdate(
        { userId: user._id },
        {
          college,
          course,
          branch,
          semester,
          rollNumber,
          cgpa,
          skills: parsedSkills,
          projects: projects || [],
          experience: experience || [],
          resumeUrl,
          linkedinUrl,
          githubUrl,
          portfolioUrl,
        },
        { upsert: true, new: true }
      ).populate('groupId', 'name code college course department semester section');
    } else if (user.role === 'faculty') {
      updatedProfile = await Faculty.findOneAndUpdate(
        { userId: user._id },
        { department, designation },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
      profile: updatedProfile,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request - Exam Portal',
      message: `You requested a password reset. Please click the link to reset your password:\n${resetUrl}`,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Email
// @route   GET /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token required' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Email verified successfully!');
  } catch (err) {
    next(err);
  }
};

// @desc    Magic Login Link
// @route   GET /api/auth/magic-login
// @access  Public
exports.magicLogin = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Magic token required' });
    }

    const magicTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      magicToken: magicTokenHash,
      magicTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired magic login link' });
    }

    user.magicToken = undefined;
    user.magicTokenExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Authenticated via Magic Link');
  } catch (err) {
    next(err);
  }
};

