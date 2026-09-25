const jwt = require('jsonwebtoken');
const User = require('../models/User');
const College = require('../models/College');
const Membership = require('../models/Membership');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const makeCollegeCode = (name) => String(name || 'COLLEGE')
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '')
  .slice(0, 8) || 'COLLEGE';

const getOrCreateCollege = async ({ name, createdBy }) => {
  const collegeName = String(name || process.env.DEFAULT_COLLEGE_NAME || 'Primary Institution').trim();
  const existing = await College.findOne({ name: { $regex: `^${collegeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
  if (existing) return existing;

  const baseCode = makeCollegeCode(collegeName);
  let code = baseCode;
  let suffix = 1;
  while (await College.exists({ code })) {
    code = `${baseCode}${suffix}`.slice(0, 12);
    suffix += 1;
  }

  return College.create({ name: collegeName, code, createdBy });
};

const ensureMembership = async (user) => {
  let memberships = await Membership.find({ userId: user._id, status: 'active' }).populate('collegeId', 'name code logoUrl isActive');
  if (memberships.length > 0) return memberships;

  const [studentProfile, facultyProfile] = await Promise.all([
    Student.findOne({ userId: user._id }),
    Faculty.findOne({ userId: user._id }),
  ]);

  const inferredCollegeName = studentProfile?.college || process.env.DEFAULT_COLLEGE_NAME || 'Primary Institution';
  const college = await getOrCreateCollege({ name: inferredCollegeName, createdBy: user._id });
  const membershipRole = user.role === 'admin' ? 'admin' : user.role;

  await Membership.findOneAndUpdate(
    { userId: user._id, collegeId: college._id },
    { userId: user._id, collegeId: college._id, role: membershipRole, status: 'active', createdBy: user._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  user.collegeIds = Array.from(new Set([...(user.collegeIds || []).map(String), college._id.toString()]));
  user.activeCollegeId = user.activeCollegeId || college._id;
  await user.save();

  if (studentProfile && !studentProfile.collegeId) {
    studentProfile.collegeId = college._id;
    await studentProfile.save();
  }
  if (facultyProfile && !facultyProfile.collegeId) {
    facultyProfile.collegeId = college._id;
    await facultyProfile.save();
  }

  memberships = await Membership.find({ userId: user._id, status: 'active' }).populate('collegeId', 'name code logoUrl isActive');
  return memberships;
};

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_exam_platform_2026_secure');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account has been deactivated. Please contact support.',
      });
    }

    const memberships = await ensureMembership(user);
    const requestedCollegeId = req.headers['x-college-id'] || decoded.activeCollegeId || user.activeCollegeId;
    const selectedMembership = memberships.find((item) => item.collegeId?._id?.toString() === requestedCollegeId?.toString()) || memberships[0];

    req.user = user;
    req.memberships = memberships;
    req.college = selectedMembership?.collegeId || null;
    req.collegeId = selectedMembership?.collegeId?._id || null;
    req.membershipRole = selectedMembership?.role || user.role;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Require a selected active college context.
exports.requireCollege = (req, res, next) => {
  if (!req.collegeId) {
    return res.status(403).json({ success: false, message: 'Active college context is required.' });
  }
  next();
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const role = req.membershipRole || req.user?.role;
    if (!req.user || !roles.includes(role) && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${role || 'none'}' is not authorized to access this route.`,
      });
    }
    next();
  };
};
