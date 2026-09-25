const College = require('../models/College');
const Membership = require('../models/Membership');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getPublicColleges = async (req, res, next) => {
  try {
    const colleges = await College.find({ isActive: true, 'settings.allowSelfRegistration': true })
      .select('name code logoUrl domain')
      .sort({ name: 1 });

    res.status(200).json({ success: true, colleges });
  } catch (err) {
    next(err);
  }
};

exports.getMyColleges = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      activeCollege: req.college || null,
      memberships: req.memberships || [],
    });
  } catch (err) {
    next(err);
  }
};

exports.getColleges = async (req, res, next) => {
  try {
    const colleges = await College.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, colleges });
  } catch (err) {
    next(err);
  }
};

exports.createCollege = async (req, res, next) => {
  let createdCollegeId = null;
  let createdAdminId = null;
  try {
    const { name, code, domain, logoUrl, address, contactEmail, contactPhone, settings, adminName, adminEmail, adminPassword } = req.body;
    if (!name || !code || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'College details and College Admin name, email, and password are required' });
    }
    if (adminPassword.length < 6) return res.status(400).json({ success: false, message: 'College Admin password must be at least 6 characters' });

    const normalizedAdminEmail = adminEmail.toLowerCase().trim();
    if (await User.exists({ email: normalizedAdminEmail })) {
      return res.status(409).json({ success: false, message: 'An account with this College Admin email already exists' });
    }

    const college = await College.create({
      name,
      code,
      domain,
      logoUrl,
      address,
      contactEmail,
      contactPhone,
      settings,
      createdBy: req.user._id,
    });
    createdCollegeId = college._id;

    await Membership.findOneAndUpdate(
      { userId: req.user._id, collegeId: college._id },
      { userId: req.user._id, collegeId: college._id, role: 'admin', status: 'active', createdBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { collegeIds: college._id },
      $set: { activeCollegeId: req.user.activeCollegeId || college._id },
    });

    const collegeAdmin = await User.create({
      name: adminName.trim(),
      email: normalizedAdminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: 'college_admin',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      collegeIds: [college._id],
      activeCollegeId: college._id,
    });
    createdAdminId = collegeAdmin._id;

    await Membership.create({
      userId: collegeAdmin._id,
      collegeId: college._id,
      role: 'college_admin',
      status: 'active',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'College and College Admin created successfully',
      college,
      collegeAdmin: { name: collegeAdmin.name, email: normalizedAdminEmail, password: adminPassword },
    });
  } catch (err) {
    if (createdAdminId) await User.findByIdAndDelete(createdAdminId).catch(() => {});
    if (createdCollegeId) {
      await Membership.deleteMany({ collegeId: createdCollegeId }).catch(() => {});
      await User.findByIdAndUpdate(req.user?._id, { $pull: { collegeIds: createdCollegeId } }).catch(() => {});
      await College.findByIdAndDelete(createdCollegeId).catch(() => {});
    }
    next(err);
  }
};

exports.updateCollege = async (req, res, next) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });

    const isMember = (req.memberships || []).some((item) => item.collegeId?._id?.toString() === college._id.toString());
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized for this college' });
    }

    const allowed = ['name', 'domain', 'logoUrl', 'address', 'contactEmail', 'contactPhone', 'isActive', 'settings'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) college[field] = req.body[field];
    });
    await college.save();

    res.status(200).json({ success: true, message: 'College updated successfully', college });
  } catch (err) {
    next(err);
  }
};

exports.switchCollege = async (req, res, next) => {
  try {
    const { collegeId } = req.body;
    const membership = await Membership.findOne({ userId: req.user._id, collegeId, status: 'active' }).populate('collegeId', 'name code logoUrl isActive');
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this college' });
    }

    req.user.activeCollegeId = membership.collegeId._id;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Active college switched',
      activeCollege: membership.collegeId,
    });
  } catch (err) {
    next(err);
  }
};
