const User = require('../models/User');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const FormSchema = require('../models/FormSchema');

// @desc    Get system analytics summary
// @route   GET /api/admin/analytics
// @access  Private (Admin, Faculty)
exports.getAnalytics = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalExams = await Exam.countDocuments({});
    const totalResults = await Result.countDocuments({});

    const passCount = await Result.countDocuments({ status: 'Pass' });
    const failCount = await Result.countDocuments({ status: 'Fail' });

    const avgScoreAgg = await Result.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$percentage' } } },
    ]);
    const averagePercentage = avgScoreAgg.length > 0 ? Number(avgScoreAgg[0].avgScore.toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      analytics: {
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

// @desc    Get list of users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Populate student profiles for students
    const userIds = users.filter(u => u.role === 'student').map(u => u._id);
    const studentProfiles = await Student.find({ userId: { $in: userIds } }).populate('groupId', 'name code').lean();
    const profileMap = {};
    studentProfiles.forEach(sp => { profileMap[sp.userId.toString()] = sp; });

    const enrichedUsers = users.map(u => ({
      ...u,
      studentProfile: profileMap[u._id.toString()] || null,
    }));

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / limit), users: enrichedUsers });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle User Active Status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update User Role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ success: true, message: `User role updated to ${role}`, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Student Roll Number & Details
// @route   PUT /api/admin/users/:id/student-profile
// @access  Private (Admin)
exports.updateStudentProfile = async (req, res, next) => {
  try {
    const { rollNumber, college, course, branch, semester, groupId } = req.body;
    const Group = require('../models/Group');

    const prevStudent = await Student.findOne({ userId: req.params.id });

    // If changing groupId, remove student from previous group
    if (prevStudent && prevStudent.groupId && prevStudent.groupId.toString() !== (groupId || '').toString()) {
      await Group.findByIdAndUpdate(prevStudent.groupId, {
        $pull: { students: req.params.id },
      });
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.params.id },
      { rollNumber, college, course, branch, semester, groupId: groupId || null },
      { upsert: true, new: true }
    ).populate('groupId', 'name code');

    // Add student to new group
    if (groupId) {
      await Group.findByIdAndUpdate(groupId, {
        $addToSet: { students: req.params.id },
      });
    }

    res.status(200).json({ success: true, message: 'Student profile updated successfully', student });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Dynamic Form Schemas
// @route   GET /api/admin/forms or GET /api/admin/forms/:formType
// @access  Private / Public
exports.getFormSchemas = async (req, res, next) => {
  try {
    const { formType } = req.params;
    if (formType) {
      const schema = await FormSchema.findOne({ formType });
      return res.status(200).json({ success: true, schema: schema || { formType, title: formType, fields: [] } });
    }
    const schemas = await FormSchema.find().sort({ formType: 1 });
    res.status(200).json({ success: true, schemas });
  } catch (err) {
    next(err);
  }
};

// @desc    Save / Update Dynamic Form Schema
// @route   POST /api/admin/forms
// @access  Private (Admin)
exports.saveFormSchema = async (req, res, next) => {
  try {
    const { formType, title, description, fields } = req.body;
    if (!formType || !title) {
      return res.status(400).json({ success: false, message: 'formType and title are required' });
    }

    const schema = await FormSchema.findOneAndUpdate(
      { formType },
      { title, description, fields, createdBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Form schema saved successfully',
      schema,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send Email Broadcast to Students or Groups
// @route   POST /api/admin/send-email
// @access  Private (Admin, Faculty)
exports.sendEmailBroadcast = async (req, res, next) => {
  try {
    const { recipientType, targetId, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message body are required' });
    }

    const sendEmail = require('../utils/sendEmail');
    let recipients = [];

    if (recipientType === 'individual' && targetId) {
      const user = await User.findById(targetId).select('email name');
      if (user) recipients.push(user);
    } else if (recipientType === 'group' && targetId) {
      const Group = require('../models/Group');
      const groupDoc = await Group.findById(targetId).populate('students', 'email name');
      if (groupDoc && groupDoc.students) {
        recipients = groupDoc.students;
      }
    } else {
      // Broadcast to all active students
      recipients = await User.find({ role: 'student' }).select('email name');
    }

    if (recipients.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid recipients found for this selection' });
    }

    let sentCount = 0;
    for (const r of recipients) {
      if (r.email) {
        sendEmail({
          email: r.email,
          subject: subject,
          message: `Hello ${r.name || 'Student'},\n\n${message}\n\nBest Regards,\nExamiQ Faculty & Admin Team`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f9; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e1e8ed;">
              <h2 style="color: #2563eb; margin-top: 0;">📢 ExamiQ Assessment Portal Notification</h2>
              <p>Hello <strong>${r.name || 'Candidate'}</strong>,</p>
              <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; white-space: pre-wrap; font-size: 15px;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <p style="margin-top: 30px; font-size: 13px; color: #64748b;">
                This is an automated notification from ExamiQ Portal.
              </p>
            </div>
          </div>`,
        }).catch(() => {});
        sentCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Email notification successfully dispatched to ${sentCount} recipient(s)!`,
      sentCount,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Categories
// @route   GET /api/admin/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Category
// @route   POST /api/admin/categories
// @access  Private (Admin, Faculty)
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({
      name: req.body.name,
      description: req.body.description,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Courses
// @route   GET /api/admin/courses
// @access  Private
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ name: 1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Course
// @route   POST /api/admin/courses
// @access  Private (Admin)
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create({
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      customFields: req.body.customFields || {},
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Audit Logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};
