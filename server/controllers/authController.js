const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const College = require('../models/College');
const Membership = require('../models/Membership');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../services/smsService');

const isPhoneVerificationRequired = () => process.env.REQUIRE_PHONE_VERIFICATION === 'true';

const getPrimaryClientUrl = () => {
  const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins[0] || 'http://localhost:5173';
};

const buildClientUrl = (path) => `${getPrimaryClientUrl()}${path}`;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const makeCollegeCode = (name) => String(name || 'COLLEGE')
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '')
  .slice(0, 8) || 'COLLEGE';

const createPhoneCode = () => String(crypto.randomInt(100000, 1000000));
const hashPhoneCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

const issuePhoneVerification = async (user) => {
  const code = createPhoneCode();
  user.isPhoneVerified = false;
  user.phoneVerificationCodeHash = hashPhoneCode(code);
  user.phoneVerificationExpire = Date.now() + 10 * 60 * 1000;
  await user.save();
  await sendSms({ phone: user.phone, message: `Your ExamiQ verification code is ${code}. It expires in 10 minutes.` });
};

const getOrCreateCollege = async ({ collegeId, collegeName, collegeCode, createdBy }) => {
  if (collegeId) {
    const collegeDoc = await College.findById(collegeId);
    if (collegeDoc) return collegeDoc;
  }

  const name = String(collegeName || process.env.DEFAULT_COLLEGE_NAME || 'Primary Institution').trim();
  let collegeDoc = await College.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } });
  if (collegeDoc) return collegeDoc;

  const baseCode = makeCollegeCode(collegeCode || name);
  let code = baseCode;
  let suffix = 1;
  while (await College.exists({ code })) {
    code = `${baseCode}${suffix}`.slice(0, 12);
    suffix += 1;
  }

  collegeDoc = await College.create({ name, code, createdBy });
  return collegeDoc;
};

const ensureUserCollegeMembership = async ({ user, collegeDoc, membershipRole, createdBy }) => {
  if (!collegeDoc) return [];

  await Membership.findOneAndUpdate(
    { userId: user._id, collegeId: collegeDoc._id },
    {
      userId: user._id,
      collegeId: collegeDoc._id,
      role: membershipRole,
      status: 'active',
      createdBy: createdBy || user._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  user.collegeIds = Array.from(new Set([...(user.collegeIds || []).map(String), collegeDoc._id.toString()]));
  user.activeCollegeId = user.activeCollegeId || collegeDoc._id;
  await user.save();

  return Membership.find({ userId: user._id, status: 'active' }).populate('collegeId', 'name code logoUrl isActive');
};

const getUserMemberships = async (user) => (
  Membership.find({ userId: user._id, status: 'active' }).populate('collegeId', 'name code logoUrl isActive')
);

const ensureExistingUserMemberships = async (user) => {
  let memberships = await getUserMemberships(user);
  if (memberships.length > 0) return memberships;
  if (await Membership.exists({ userId: user._id })) return [];

  const studentProfile = await Student.findOne({ userId: user._id });
  const facultyProfile = await Faculty.findOne({ userId: user._id });
  const mappedCollegeId = studentProfile?.collegeId || facultyProfile?.collegeId || user.activeCollegeId || user.collegeIds?.[0];
  const collegeDoc = mappedCollegeId ? await College.findById(mappedCollegeId) : await getOrCreateCollege({
    collegeName: studentProfile?.college || process.env.DEFAULT_COLLEGE_NAME || 'Primary Institution',
    createdBy: user._id,
  });
  if (!collegeDoc || !collegeDoc.isActive) return [];

  memberships = await ensureUserCollegeMembership({
    user,
    collegeDoc,
    membershipRole: user.role === 'admin' ? 'admin' : user.role,
    createdBy: user._id,
  });

  if (studentProfile && !studentProfile.collegeId) {
    studentProfile.collegeId = collegeDoc._id;
    studentProfile.college = studentProfile.college || collegeDoc.name;
    await studentProfile.save();
  }

  if (facultyProfile && !facultyProfile.collegeId) {
    facultyProfile.collegeId = collegeDoc._id;
    await facultyProfile.save();
  }

  return memberships;
};

// Helper to generate JWT token
const sendTokenResponse = async (user, statusCode, res, message = 'Success', membershipsArg = null) => {
  const memberships = membershipsArg || await getUserMemberships(user);
  const activeCollegeId = user.activeCollegeId || memberships[0]?.collegeId?._id || null;
  const token = jwt.sign(
    { id: user._id, role: user.role, activeCollegeId, tokenVersion: user.tokenVersion || 0 },
    process.env.JWT_SECRET || 'super_secret_jwt_key_exam_platform_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const userObj = user.toObject();
  for (const field of ['password', 'resetPasswordToken', 'resetPasswordExpire', 'magicToken', 'magicTokenExpire', 'verificationToken', 'phoneVerificationCodeHash', 'phoneVerificationExpire']) delete userObj[field];

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userObj,
    activeCollege: memberships.find((item) => item.collegeId?._id?.toString() === activeCollegeId?.toString())?.collegeId || memberships[0]?.collegeId || null,
    memberships,
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
      collegeId,
      collegeName,
      collegeCode,
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

    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Faculty and admin accounts must be created by a college administrator',
      });
    }

    if (isPhoneVerificationRequired() && !String(phone || '').trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required for registration' });
    }

    const collegeDoc = await College.findById(collegeId);
    if (!collegeDoc || collegeDoc.isDeleted || !collegeDoc.isActive || !collegeDoc.settings?.allowSelfRegistration || collegeDoc.settings?.requireInviteCode) {
      return res.status(400).json({ success: false, message: 'This college is not available for self registration' });
    }
    let targetGroup = null;
    if (groupId) {
      const Group = require('../models/Group');
      targetGroup = await Group.findOne({ _id: groupId, collegeId: collegeDoc._id });
      if (!targetGroup) return res.status(400).json({ success: false, message: 'Group must belong to the selected college' });
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

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || '',
      isPhoneVerified: !isPhoneVerificationRequired(),
      isEmailVerified: true,
    });

    const memberships = await ensureUserCollegeMembership({
      user,
      collegeDoc,
      membershipRole: role === 'admin' ? 'admin' : role,
      createdBy: user._id,
    });

    if (isPhoneVerificationRequired()) {
      try {
        await issuePhoneVerification(user);
      } catch (smsError) {
        await Membership.deleteMany({ userId: user._id });
        await User.findByIdAndDelete(user._id);
        return next(smsError);
      }
    }

    if (role === 'student') {
      let assignedGroupId = groupId || null;

      if (targetGroup && !targetGroup.students.includes(user._id)) {
        targetGroup.students.push(user._id);
        await targetGroup.save();
      }

      await Student.create({
        userId: user._id,
        collegeId: collegeDoc._id,
        groupId: assignedGroupId,
        college: college || collegeDoc.name || '',
        course: course || '',
        branch: branch || '',
        semester: semester || '',
        rollNumber: rollNumber || '',
      });
    } else if (role === 'faculty') {
      await Faculty.create({
        userId: user._id,
        collegeId: collegeDoc._id,
        department: department || '',
        designation: designation || '',
        employeeId: employeeId || '',
      });
    }
    if (isPhoneVerificationRequired()) {
      const userObj = user.toObject();
      for (const field of ['password', 'resetPasswordToken', 'resetPasswordExpire', 'magicToken', 'magicTokenExpire', 'verificationToken', 'phoneVerificationCodeHash', 'phoneVerificationExpire']) delete userObj[field];
      return res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your mobile number before logging in.',
        user: userObj,
        verificationRequired: false,
        phoneVerificationRequired: true,
        activeCollege: collegeDoc,
        memberships,
      });
    }

    await sendTokenResponse(user, 201, res, 'Registration successful', memberships);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    const resolvedUser = user;

    if (!resolvedUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, resolvedUser.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!resolvedUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by administrator',
      });
    }

    if (isPhoneVerificationRequired() && resolvedUser.phone && !resolvedUser.isPhoneVerified) {
      return res.status(403).json({
        success: false,
        code: 'PHONE_VERIFICATION_REQUIRED',
        message: 'Please verify your mobile number before logging in',
      });
    }

    const memberships = await ensureExistingUserMemberships(resolvedUser);
    await sendTokenResponse(resolvedUser, 200, res, 'Login successful', memberships);
  } catch (err) {
    next(err);
  }
};

// Change only the authenticated user's password after verifying the old password.
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !user.isActive) return res.status(403).json({ success: false, message: 'Your account is unavailable' });
    if (!await bcrypt.compare(currentPassword, user.password)) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    if (await bcrypt.compare(newPassword, user.password)) return res.status(400).json({ success: false, message: 'New password must be different from your current password' });

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, password: user.password },
      {
        $set: { password: await bcrypt.hash(newPassword, 10) },
        $inc: { tokenVersion: 1 },
        $unset: { resetPasswordToken: '', resetPasswordExpire: '', magicToken: '', magicTokenExpire: '' },
      },
      { new: true, runValidators: true }
    );
    if (!updatedUser) return res.status(409).json({ success: false, message: 'Your password changed during this request. Please sign in again.' });
    await sendTokenResponse(updatedUser, 200, res, 'Password changed successfully. Other sessions have been signed out.', req.memberships);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let extendedProfile = null;
    const memberships = req.memberships || await getUserMemberships(user);

    if (user.role === 'student') {
      extendedProfile = await Student.findOne({ userId: user._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) }).populate('groupId', 'name code college course department semester section');
    } else if (user.role === 'faculty') {
      extendedProfile = await Faculty.findOne({ userId: user._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    }

    res.status(200).json({
      success: true,
      user,
      profile: extendedProfile,
      activeCollege: req.college || null,
      memberships,
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

    const phoneChanged = phone !== undefined && phone !== req.user.phone;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, ...(phoneChanged && isPhoneVerificationRequired() ? { isPhoneVerified: false } : {}) },
      { new: true, runValidators: true }
    );

    let updatedProfile = null;

    if (user.role === 'student') {
      const parsedSkills = skills === undefined ? undefined : Array.isArray(skills)
        ? skills
        : (skills || '').split(',').map((s) => s.trim()).filter(Boolean);

      updatedProfile = await Student.findOneAndUpdate(
        { userId: user._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) },
        {
          collegeId: req.collegeId || undefined,
          college: req.college?.name || '',
          course,
          branch,
          semester,
          rollNumber,
          cgpa,
          skills: parsedSkills,
          projects,
          experience,
          resumeUrl,
          linkedinUrl,
          githubUrl,
          portfolioUrl,
        },
        { upsert: true, new: true, runValidators: true }
      ).populate('groupId', 'name code college course department semester section');
    } else if (user.role === 'faculty') {
      updatedProfile = await Faculty.findOneAndUpdate(
        { userId: user._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) },
        { collegeId: req.collegeId || undefined, department, designation },
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

    res.status(200).json({ success: true, message: 'Password reset successful. Please sign in with your new password.' });
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

    if (isPhoneVerificationRequired() && user.phone && !user.isPhoneVerified) {
      return res.status(200).json({
        success: true,
        phoneVerificationRequired: true,
        message: 'Email verified. Please verify your mobile number before logging in.',
        user: { ...user.toObject(), password: undefined },
      });
    }

    await sendTokenResponse(user, 200, res, 'Email verified successfully!');
  } catch (err) {
    next(err);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ success: true, message: 'This email address is already verified' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    const verifyUrl = buildClientUrl(`/verify-email?token=${verificationToken}`);
    await sendEmail({
      email: user.email,
      subject: 'Verify your ExamiQ account',
      message: `Hello ${user.name},\n\nPlease verify your ExamiQ account using this link:\n${verifyUrl}`,
    });

    res.status(200).json({ success: true, message: 'Verification link sent to your email' });
  } catch (err) {
    next(err);
  }
};

// @desc    Send or resend mobile verification code
// @route   POST /api/auth/phone/request-code
// @access  Public
exports.requestPhoneVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+phone');
    if (!user || !user.phone) {
      return res.status(404).json({ success: false, message: 'No account with a mobile number was found' });
    }
    if (user.isPhoneVerified) {
      return res.status(200).json({ success: true, message: 'This mobile number is already verified' });
    }

    await issuePhoneVerification(user);
    res.status(200).json({ success: true, message: 'Mobile verification code sent' });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify mobile verification code
// @route   POST /api/auth/phone/verify
// @access  Public
exports.verifyPhone = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const user = await User.findOne({
      email,
      phoneVerificationCodeHash: hashPhoneCode(code),
      phoneVerificationExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired mobile verification code' });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationCodeHash = undefined;
    user.phoneVerificationExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Mobile number verified successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Request Magic Login Link
// @route   POST /api/auth/magic-login
// @access  Public
exports.requestMagicLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'No active account found with this email' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    user.magicToken = crypto.createHash('sha256').update(token).digest('hex');
    user.magicTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const magicUrl = buildClientUrl(`/magic-login?token=${token}`);
    await sendEmail({
      email: user.email,
      subject: 'Your ExamiQ magic login link',
      message: `Hello ${user.name},\n\nUse this secure link to sign in to ExamiQ:\n${magicUrl}\n\nThis link expires in 15 minutes.`,
    });

    res.status(200).json({ success: true, message: 'Magic login link sent to your email' });
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

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Your account has been deactivated by administrator' });
    if (isPhoneVerificationRequired() && user.phone && !user.isPhoneVerified) return res.status(403).json({ success: false, message: 'Please verify your mobile number before logging in' });

    user.magicToken = undefined;
    user.magicTokenExpire = undefined;
    await user.save();

    await sendTokenResponse(user, 200, res, 'Authenticated via Magic Link');
  } catch (err) {
    next(err);
  }
};


