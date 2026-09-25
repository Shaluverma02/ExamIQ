const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const FormSchema = require('../models/FormSchema');
const Membership = require('../models/Membership');
const Group = require('../models/Group');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const College = require('./../models/College');

const collegeFilter = (req, query = {}) => (req.collegeId ? { ...query, collegeId: req.collegeId } : query);

const getCollegeUserIds = async (req, role = null) => {
  if (!req.collegeId) return null;
  const query = { collegeId: req.collegeId, status: 'active' };
  if (role) query.role = role;
  const memberships = await Membership.find(query).select('userId');
  return memberships.map((item) => item.userId);
};

// @desc    Get college analytics summary
// @route   GET /api/admin/analytics
// @access  Private (Admin, Faculty)
exports.getAnalytics = async (req, res, next) => {
  try {
    const [studentIds, facultyIds] = await Promise.all([
      getCollegeUserIds(req, 'student'),
      getCollegeUserIds(req, 'faculty'),
    ]);

    const resultQuery = collegeFilter(req);
    const totalStudents = studentIds ? studentIds.length : await User.countDocuments({ role: 'student' });
    const totalFaculty = facultyIds ? facultyIds.length : await User.countDocuments({ role: 'faculty' });
    const totalExams = await Exam.countDocuments(collegeFilter(req));
    const totalResults = await Result.countDocuments(resultQuery);
    const passCount = await Result.countDocuments({ ...resultQuery, status: 'Pass' });
    const failCount = await Result.countDocuments({ ...resultQuery, status: 'Fail' });

    const avgScoreAgg = await Result.aggregate([
      { $match: req.collegeId ? { collegeId: req.collegeId } : {} },
      { $group: { _id: null, avgScore: { $avg: '$percentage' } } },
    ]);
    const averagePercentage = avgScoreAgg.length > 0 ? Number(avgScoreAgg[0].avgScore.toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      analytics: {
        college: req.college || null,
        totalStudents,
        totalFaculty,
        totalExams,
        totalAttempts: totalResults,
        passCount,
        failCount,
        passPercentage: totalResults > 0 ? Number(((passCount / totalResults) * 100).toFixed(2)) : 0,
        averagePercentage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get list of users scoped to active college
// @route   GET /api/admin/users
// @access  Private (Admin, Faculty)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (req.collegeId) query.collegeIds = req.collegeId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const userIds = users.map((u) => u._id);
    const studentProfiles = await Student.find({ userId: { $in: userIds }, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .populate('groupId', 'name code college course department semester section')
      .lean();
    const profileMap = {};
    studentProfiles.forEach((sp) => { profileMap[sp.userId.toString()] = sp; });

    const enrichedUsers = users.map((u) => ({ ...u, studentProfile: profileMap[u._id.toString()] || null }));
    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / Number(limit)), users: enrichedUsers });
  } catch (err) {
    next(err);
  }
};

exports.getCollegeAdmins = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ role: 'college_admin', status: 'active' })
      .populate('userId', 'name email phone isActive createdAt')
      .populate('collegeId', 'name code');
    res.status(200).json({ success: true, admins: memberships });
  } catch (err) {
    next(err);
  }
};

exports.createCollegeAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone, collegeId } = req.body;
    if (!name || !email || !password || !collegeId) {
      return res.status(400).json({ success: false, message: 'Name, email, password and college are required' });
    }

    const [college, existingUser] = await Promise.all([
      College.findById(collegeId),
      User.findOne({ email: email.toLowerCase().trim() }),
    ]);
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });
    if (existingUser) return res.status(400).json({ success: false, message: 'An account with this email already exists' });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      phone: phone || '',
      role: 'college_admin',
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    const membership = await Membership.create({
      userId: user._id,
      collegeId: college._id,
      role: 'college_admin',
      status: 'active',
      createdBy: req.user._id,
    });
    user.collegeIds = [college._id];
    user.activeCollegeId = college._id;
    await user.save();

    const userObject = user.toObject();
    delete userObject.password;
    res.status(201).json({ success: true, message: 'College admin created successfully', user: userObject, membership });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.collegeId) query.collegeIds = req.collegeId;
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: 'User not found in this college' });

    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const query = { _id: req.params.id };
    if (req.collegeId) query.collegeIds = req.collegeId;
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: 'User not found in this college' });

    user.role = role;
    await user.save();
    if (req.collegeId) {
      await Membership.findOneAndUpdate({ userId: user._id, collegeId: req.collegeId }, { role }, { new: true });
    }

    res.status(200).json({ success: true, message: `User role updated to ${role}`, user });
  } catch (err) {
    next(err);
  }
};

exports.updateStudentProfile = async (req, res, next) => {
  try {
    const { rollNumber, college, course, branch, semester, groupId } = req.body;
    const targetUser = await User.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeIds: req.collegeId } : {}) });
    if (!targetUser) return res.status(404).json({ success: false, message: 'Student not found in this college' });

    const prevStudent = await Student.findOne({ userId: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    if (prevStudent?.groupId && prevStudent.groupId.toString() !== (groupId || '').toString()) {
      await Group.findOneAndUpdate({ _id: prevStudent.groupId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) }, { $pull: { students: req.params.id } });
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) },
      { collegeId: req.collegeId || undefined, rollNumber, college: college || req.college?.name || '', course, branch, semester, groupId: groupId || null },
      { upsert: true, new: true }
    ).populate('groupId', 'name code');

    if (groupId) {
      await Group.findOneAndUpdate({ _id: groupId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) }, { $addToSet: { students: req.params.id } });
    }

    res.status(200).json({ success: true, message: 'Student profile updated successfully', student });
  } catch (err) {
    next(err);
  }
};

exports.getFormSchemas = async (req, res, next) => {
  try {
    const { formType } = req.params;
    const query = collegeFilter(req, formType ? { formType } : {});
    if (formType) {
      const schema = await FormSchema.findOne(query);
      return res.status(200).json({ success: true, schema: schema || { formType, title: formType, fields: [] } });
    }
    const schemas = await FormSchema.find(query).sort({ formType: 1 });
    res.status(200).json({ success: true, schemas });
  } catch (err) {
    next(err);
  }
};

exports.saveFormSchema = async (req, res, next) => {
  try {
    const { formType, title, description, fields } = req.body;
    if (!formType || !title) return res.status(400).json({ success: false, message: 'formType and title are required' });

    const schema = await FormSchema.findOneAndUpdate(
      collegeFilter(req, { formType }),
      { collegeId: req.collegeId || undefined, title, description, fields, createdBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Form schema saved successfully', schema });
  } catch (err) {
    next(err);
  }
};

exports.sendEmailBroadcast = async (req, res, next) => {
  try {
    const { recipientType, targetId, subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message body are required' });

    let recipients = [];
    if (recipientType === 'individual' && targetId) {
      const user = await User.findOne({ _id: targetId, ...(req.collegeId ? { collegeIds: req.collegeId } : {}) }).select('email name');
      if (user) recipients.push(user);
    } else if (recipientType === 'group' && targetId) {
      const groupDoc = await Group.findOne({ _id: targetId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) }).populate('students', 'email name');
      if (groupDoc?.students) recipients = groupDoc.students;
    } else {
      const studentIds = await getCollegeUserIds(req, 'student');
      recipients = await User.find({ role: 'student', isActive: true, ...(studentIds ? { _id: { $in: studentIds } } : {}) }).select('email name');
    }

    if (recipients.length === 0) return res.status(404).json({ success: false, message: 'No valid recipients found for this selection' });

    let sentCount = 0;
    for (const r of recipients) {
      if (!r.email) continue;
      await sendEmail({
        email: r.email,
        subject,
        message: `Hello ${r.name || 'Student'},\n\n${message}\n\nBest Regards,\n${req.college?.name || 'ExamiQ'} Team`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;"><h2>${req.college?.name || 'ExamiQ'} Notification</h2><p>Hello <strong>${r.name || 'Candidate'}</strong>,</p><div style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div></div>`,
      });
      sentCount += 1;
    }

    res.status(200).json({ success: true, message: `Email notification dispatched to ${sentCount} recipient(s)`, sentCount });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find(collegeFilter(req)).sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({ collegeId: req.collegeId || undefined, name: req.body.name, description: req.body.description, createdBy: req.user._id });
    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find(collegeFilter(req)).sort({ name: 1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create({ collegeId: req.collegeId || undefined, name: req.body.name, code: req.body.code, description: req.body.description, customFields: req.body.customFields || {}, createdBy: req.user._id });
    res.status(201).json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find(collegeFilter(req))
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};
