const College = require('../models/College');
const Membership = require('../models/Membership');
const User = require('../models/User');
const ExamAttempt = require('../models/ExamAttempt');

exports.getPublicColleges = async (req, res, next) => {
  try {
    const colleges = await College.find({
      isDeleted: { $ne: true },
      isActive: true,
      'settings.allowSelfRegistration': true,
      'settings.requireInviteCode': { $ne: true },
    })
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
    const colleges = await College.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    const admins = await Membership.find({ collegeId: { $in: colleges.map(college => college._id) }, role: 'college_admin', status: 'active' }).populate('userId', 'name email isActive');
    const enriched = colleges.map(college => ({ ...college.toObject(), admins: admins.filter(admin => String(admin.collegeId) === String(college._id) && admin.userId).map(admin => admin.userId) }));
    res.status(200).json({ success: true, colleges: enriched });
  } catch (err) {
    next(err);
  }
};

exports.createCollege = async (req, res, next) => {
  let createdCollegeId = null;
  try {
    const { name, code, domain, logoUrl, address, contactEmail, contactPhone } = req.body;
    if (req.body.settings !== undefined) return res.status(403).json({ success: false, message: 'Registration settings can only be managed by the institution administrator' });
    if (!String(name || '').trim() || !String(code || '').trim()) return res.status(400).json({ success: false, message: 'College name and code are required' });
    const college = await College.create({ name: name.trim(), code: code.trim().toUpperCase(), domain, logoUrl, address, contactEmail, contactPhone, isActive: req.body.isActive !== false, createdBy: req.user._id });
    createdCollegeId = college._id;
    await Membership.findOneAndUpdate(
      { userId: req.user._id, collegeId: college._id },
      { userId: req.user._id, collegeId: college._id, role: 'admin', status: 'active', createdBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { collegeIds: college._id }, $set: { activeCollegeId: req.user.activeCollegeId || college._id } });
    res.status(201).json({ success: true, message: 'College created. Add a college administrator separately.', college });
  } catch (err) {
    if (createdCollegeId) {
      await Membership.deleteMany({ collegeId: createdCollegeId }).catch(() => {});
      await User.findByIdAndUpdate(req.user?._id, { $pull: { collegeIds: createdCollegeId } }).catch(() => {});
      await College.findByIdAndDelete(createdCollegeId).catch(() => {});
    }
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'This college code already exists. Choose a different code.' });
    next(err);
  }
};

// Remove the workspace from use while preserving academic records.
exports.deleteCollege = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only Super Admin can delete a college' });
    const college = await College.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!college || college.isDeleted) return res.status(404).json({ success: false, message: 'College not found' });
    if (await ExamAttempt.exists({ collegeId: college._id, status: 'started' })) return res.status(409).json({ success: false, code: 'COLLEGE_HAS_ACTIVE_ATTEMPTS', message: 'Students are taking an exam in this college. Wait until all attempts finish before deleting it.' });
    college.isDeleted = true;
    college.isActive = false;
    college.deletedAt = new Date();
    college.settings.allowSelfRegistration = false;
    await college.save();
    if (typeof Membership.updateMany === 'function') {
      await Membership.updateMany({ collegeId: college._id }, { $set: { status: 'suspended' } });
    }
    res.status(200).json({ success: true, message: 'College removed. Academic records are preserved.' });
  } catch (err) { next(err); }
};

exports.getCurrentCollege = async (req, res, next) => {
  try {
    const college = await College.findById(req.collegeId);
    if (!college || college.isDeleted) return res.status(404).json({ success: false, message: 'College not found' });
    res.json({ success: true, college });
  } catch (error) { next(error); }
};

exports.updateCollege = async (req, res, next) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college || college.isDeleted) return res.status(404).json({ success: false, message: 'College not found' });

    const isMember = (req.memberships || []).some((item) => item.collegeId?._id?.toString() === college._id.toString());
    if (req.user.role === 'college_admin' && (req.membershipRole !== 'college_admin' || String(req.collegeId) !== String(college._id))) return res.status(403).json({ success: false, message: 'Select the assigned college administrator workspace to update settings' });
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized for this college' });
    }
    if (req.user.role === 'admin' && req.body.settings !== undefined) return res.status(403).json({ success: false, message: 'Registration settings can only be managed by the institution administrator' });

    const allowed = ['name', 'domain', 'logoUrl', 'address', 'contactEmail', 'contactPhone', 'isActive'];
    if (req.user.role === 'college_admin') allowed.push('settings');
    if (req.user.role === 'college_admin' && ['name', 'code', 'isActive'].some(field => req.body[field] !== undefined)) return res.status(403).json({ success: false, message: 'Only Super Admin can change college identity or active status' });
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
    if (!membership || !membership.collegeId?.isActive) {
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
