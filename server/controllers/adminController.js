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
const isObjectId = (value) => /^[a-f\d]{24}$/i.test(value);

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
    const averageScore = Number(avgScoreAgg[0]?.avgScore || 0);
    const averagePercentage = Number.isFinite(averageScore) ? Number(averageScore.toFixed(2)) : 0;

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
    if (req.collegeId) query._id = { $in: await getCollegeUserIds(req, role || null) };
    if (search) {
      const searchRegex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingGroups = await Group.find(collegeFilter(req, { name: searchRegex })).select('_id').lean();
      const matchingStudents = await Student.find({
        ...(req.collegeId ? { collegeId: req.collegeId } : {}),
        $or: [
          { college: searchRegex },
          { course: searchRegex },
          { branch: searchRegex },
          { semester: searchRegex },
          { rollNumber: searchRegex },
          { groupId: { $in: matchingGroups.map((group) => group._id) } },
        ],
      }).select('userId').lean();
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { _id: { $in: matchingStudents.map((student) => student.userId) } },
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
      .populate({ path: 'collegeId', select: 'name code', match: { isDeleted: { $ne: true } } });
    res.status(200).json({ success: true, admins: memberships.filter(item => item.collegeId && item.userId) });
  } catch (err) {
    next(err);
  }
};

exports.createCollegeAdmin = async (req, res, next) => {
  let createdAdminId = null;
  try {
    const { name, email, password, phone, collegeId } = req.body;
    if (!name || !email || !password || !collegeId) {
      return res.status(400).json({ success: false, message: 'Name, email, password and college are required' });
    }

    if (String(password).length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const [college, existingUser] = await Promise.all([
      College.findById(collegeId),
      User.findOne({ email: email.toLowerCase().trim() }),
    ]);
    if (!college || college.isDeleted) return res.status(404).json({ success: false, message: 'College not found' });
    if (!college.isActive) return res.status(400).json({ success: false, message: 'Activate the college before adding an administrator' });
    if (existingUser) return res.status(400).json({ success: false, message: 'An account with this email already exists' });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      phone: phone || '',
      role: 'college_admin',
      collegeIds: [college._id],
      activeCollegeId: college._id,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    createdAdminId = user._id;
    const membership = await Membership.create({
      userId: user._id,
      collegeId: college._id,
      role: 'college_admin',
      status: 'active',
      createdBy: req.user._id,
    });
    const userObject = user.toObject();
    delete userObject.password;
    res.status(201).json({ success: true, message: 'College admin created successfully', user: userObject, membership });
  } catch (err) {
    if (createdAdminId) {
      await Membership.deleteMany({ userId: createdAdminId }).catch(() => {});
      await User.findByIdAndDelete(createdAdminId).catch(() => {});
    }
    next(err);
  }
};

exports.deleteCollegeAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can remove a college administrator' });
    }

    const { id } = req.params;
    const membership = await Membership.findOne({
      $or: [
        { _id: id, role: 'college_admin' },
        { userId: id, role: 'college_admin' },
      ],
    }).populate('userId');

    if (!membership) {
      return res.status(404).json({ success: false, message: 'College administrator assignment not found' });
    }

    const targetUser = membership.userId;
    const targetUserId = targetUser?._id || membership.userId;

    if (String(targetUserId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own administrator account' });
    }

    await Membership.findByIdAndDelete(membership._id);

    if (targetUser) {
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { collegeIds: membership.collegeId },
      });

      const otherMemberships = await Membership.find({ userId: targetUserId, status: 'active' });
      if (otherMemberships.length > 0) {
        if (String(targetUser.activeCollegeId) === String(membership.collegeId)) {
          await User.findByIdAndUpdate(targetUserId, {
            activeCollegeId: otherMemberships[0].collegeId,
          });
        }
      } else {
        const [hasStudent, hasFaculty, hasResult] = await Promise.all([
          typeof Student.exists === 'function' ? Student.exists({ userId: targetUserId }) : null,
          typeof Faculty.exists === 'function' ? Faculty.exists({ userId: targetUserId }) : null,
          typeof Result.exists === 'function' ? Result.exists({ userId: targetUserId }) : null,
        ]);

        if (!hasStudent && !hasFaculty && !hasResult) {
          await User.findByIdAndDelete(targetUserId);
        } else {
          await User.findByIdAndUpdate(targetUserId, {
            isActive: false,
            activeCollegeId: null,
            role: hasFaculty ? 'faculty' : 'student',
          });
        }
      }
    }

    if (typeof AuditLog.create === 'function') {
      await AuditLog.create({
        userId: req.user._id,
        collegeId: membership.collegeId,
        role: 'admin',
        action: 'DELETE_COLLEGE_ADMIN',
        resource: 'User',
        resourceId: String(targetUserId),
        ipAddress: req.ip || '',
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'College administrator removed successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.createFaculty = async (req, res, next) => {
  let createdId;
  try {
    if (!req.collegeId || req.membershipRole !== 'college_admin') return res.status(403).json({ success: false, message: 'An active college administrator workspace is required' });
    const { name, email, password, phone = '', department = '', designation = '', employeeId = '' } = req.body;
    const college = await College.findById(req.collegeId);
    if (!college || !college.isActive || college.isDeleted) return res.status(403).json({ success: false, message: 'College is unavailable' });
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    if (employeeId && await Faculty.exists({ collegeId: req.collegeId, employeeId })) return res.status(409).json({ success: false, message: 'Employee ID already exists in this college' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), phone, role: 'faculty', collegeIds: [req.collegeId], activeCollegeId: req.collegeId, isActive: true, isEmailVerified: true, isPhoneVerified: true });
    createdId = user._id;
    await Faculty.create({ userId: user._id, collegeId: req.collegeId, department, designation, employeeId });
    await Membership.create({ userId: user._id, collegeId: req.collegeId, role: 'faculty', status: 'active', createdBy: req.user._id });
    const safeUser = user.toObject(); delete safeUser.password;
    return res.status(201).json({ success: true, message: 'Faculty account created successfully', user: safeUser });
  } catch (error) {
    if (createdId) await Promise.all([Membership.deleteMany({ userId: createdId }), Faculty.deleteMany({ userId: createdId }), User.findByIdAndDelete(createdId)]);
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  let createdId;
  try {
    if (!req.collegeId || req.membershipRole !== 'college_admin') return res.status(403).json({ success: false, message: 'An active college administrator workspace is required' });
    const { name, email, password, phone = '', rollNumber = '', course = '', branch = '', semester = '' } = req.body;
    const college = await College.findById(req.collegeId);
    if (!college || !college.isActive || college.isDeleted) return res.status(403).json({ success: false, message: 'College is unavailable' });
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    if (rollNumber && await Student.exists({ collegeId: req.collegeId, rollNumber })) return res.status(409).json({ success: false, message: 'Roll number already exists in this college' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), phone, role: 'student', collegeIds: [req.collegeId], activeCollegeId: req.collegeId, isActive: true, isEmailVerified: true, isPhoneVerified: true });
    createdId = user._id;
    await Student.create({ userId: user._id, collegeId: req.collegeId, college: college.name, rollNumber, course, branch, semester });
    await Membership.create({ userId: user._id, collegeId: req.collegeId, role: 'student', status: 'active', createdBy: req.user._id });
    await AuditLog.create({ userId: req.user._id, collegeId: req.collegeId, role: 'college_admin', action: 'CREATE_STUDENT', resource: 'User', resourceId: String(user._id), ipAddress: req.ip || '' });
    const safe = user.toObject(); delete safe.password;
    res.status(201).json({ success: true, message: 'Student account created successfully', user: safe });
  } catch (error) {
    if (createdId) await Promise.all([Membership.deleteMany({ userId: createdId }), Student.deleteMany({ userId: createdId }), User.findByIdAndDelete(createdId)]);
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    next(error);
  }
};

exports.importStudents = async (req, res, next) => {
  try {
    if (!req.collegeId || req.membershipRole !== 'college_admin') {
      return res.status(403).json({ success: false, message: 'An active college administrator workspace is required' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'Select a CSV or Excel file to import' });
    if (!/\.(csv|xlsx)$/i.test(req.file.originalname)) {
      return res.status(400).json({ success: false, message: 'Only .csv and .xlsx files are supported' });
    }

    const XLSX = require('xlsx');
    let rows;
    try {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer', raw: false });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) return res.status(400).json({ success: false, message: 'The spreadsheet has no worksheets' });
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { raw: false, defval: '', blankrows: false });
    } catch (error) {
      return res.status(400).json({ success: false, message: 'The uploaded file could not be read as a spreadsheet' });
    }
    if (!rows.length) return res.status(400).json({ success: false, message: 'The spreadsheet contains no student rows' });
    if (rows.length > 500) return res.status(400).json({ success: false, message: 'Import is limited to 500 students per file' });

    const fieldAliases = {
      name: ['name', 'fullname', 'studentname'],
      email: ['email', 'emailaddress'],
      password: ['password', 'temppassword', 'temporarypassword'],
      phone: ['phone', 'phonenumber'],
      course: ['course'],
      branch: ['branch'],
      rollNumber: ['rollnumber', 'rollno'],
      semester: ['semester'],
    };
    const normalizeHeader = (header) => String(header).replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const headers = new Set(Object.keys(rows[0]).map(normalizeHeader));
    const missingHeaders = ['name', 'email', 'password'].filter((field) => !fieldAliases[field].some((alias) => headers.has(alias)));
    if (missingHeaders.length) {
      return res.status(400).json({
        success: false,
        message: `Required columns are missing: ${missingHeaders.join(', ')}`,
      });
    }

    const college = await College.findById(req.collegeId);
    if (!college || !college.isActive || college.isDeleted) {
      return res.status(403).json({ success: false, message: 'College is unavailable' });
    }

    const getField = (row, field) => {
      const alias = fieldAliases[field].find((candidate) => Object.keys(row).some((key) => normalizeHeader(key) === candidate));
      if (!alias) return '';
      const key = Object.keys(row).find((candidate) => normalizeHeader(candidate) === alias);
      return String(row[key] ?? '');
    };
    const seenEmails = new Set();
    const seenRollNumbers = new Set();
    const results = [];

    for (const [index, row] of rows.entries()) {
      const line = index + 2;
      const student = {
        name: getField(row, 'name').trim(),
        email: getField(row, 'email').trim().toLowerCase(),
        password: getField(row, 'password'),
        phone: getField(row, 'phone').trim(),
        course: getField(row, 'course').trim(),
        branch: getField(row, 'branch').trim(),
        rollNumber: getField(row, 'rollNumber').trim(),
        semester: getField(row, 'semester').trim(),
      };
      let error = '';

      if (!student.name || student.name.length > 120) error = 'Name is required and must be 120 characters or fewer';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) error = 'Enter a valid email address';
      else if (student.email.length > 254) error = 'Email must be 254 characters or fewer';
      else if (student.password.length < 6 || Buffer.byteLength(student.password, 'utf8') > 72) error = 'Password must be 6 to 72 bytes';
      else if (['phone', 'course', 'branch', 'rollNumber', 'semester'].some((field) => student[field].length > 120)) error = 'Optional fields must be 120 characters or fewer';
      else if (student.phone && (!/^\+?[\d\s()-]+$/.test(student.phone) || student.phone.replace(/\D/g, '').length < 7 || student.phone.replace(/\D/g, '').length > 15)) error = 'Enter a valid phone number';
      else if (seenEmails.has(student.email)) error = 'Email is repeated in this file';
      else if (student.rollNumber && seenRollNumbers.has(student.rollNumber.toLowerCase())) error = 'Roll number is repeated in this file';

      if (!error) {
        seenEmails.add(student.email);
        if (student.rollNumber) seenRollNumbers.add(student.rollNumber.toLowerCase());
        if (await User.exists({ email: student.email })) error = 'An account with this email already exists';
        else if (student.rollNumber && await Student.exists({ collegeId: req.collegeId, rollNumber: student.rollNumber })) error = 'Roll number already exists in this college';
      }

      if (error) {
        results.push({ row: line, email: student.email, status: 'failed', error });
        continue;
      }

      let createdId;
      try {
        const user = await User.create({
          name: student.name,
          email: student.email,
          password: await bcrypt.hash(student.password, 10),
          phone: student.phone,
          role: 'student',
          collegeIds: [req.collegeId],
          activeCollegeId: req.collegeId,
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
        });
        createdId = user._id;
        await Student.create({
          userId: user._id,
          collegeId: req.collegeId,
          college: college.name,
          rollNumber: student.rollNumber,
          course: student.course,
          branch: student.branch,
          semester: student.semester,
        });
        await Membership.create({ userId: user._id, collegeId: req.collegeId, role: 'student', status: 'active', createdBy: req.user._id });
        await AuditLog.create({
          userId: req.user._id,
          collegeId: req.collegeId,
          role: 'college_admin',
          action: 'CREATE_STUDENT',
          resource: 'User',
          resourceId: String(user._id),
          ipAddress: req.ip || '',
        });
        results.push({ row: line, email: student.email, status: 'imported' });
      } catch (rowError) {
        if (createdId) {
          try {
            await Promise.all([
              Membership.deleteMany({ userId: createdId }),
              Student.deleteMany({ userId: createdId }),
              User.findByIdAndDelete(createdId),
            ]);
          } catch (cleanupError) {
            console.error(`Failed to roll back imported student on row ${line}`, cleanupError);
            return next(cleanupError);
          }
        }
        if (rowError.code === 11000) {
          results.push({ row: line, email: student.email, status: 'failed', error: 'Email or roll number already exists' });
        } else if (rowError.name === 'ValidationError') {
          results.push({ row: line, email: student.email, status: 'failed', error: rowError.message });
        } else {
          console.error(`Failed to import student on row ${line}`, rowError);
          results.push({ row: line, email: student.email, status: 'failed', error: 'Server error while creating this student account' });
        }
      }
    }

    const importedCount = results.filter((result) => result.status === 'imported').length;
    return res.status(200).json({
      success: true,
      importedCount,
      failedCount: results.length - importedCount,
      results,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    const query = { _id: req.params.id };
    if (req.collegeId) query.collegeIds = req.collegeId;
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: 'User not found in this college' });

    if (req.user.role !== 'admin' && ['admin', 'college_admin'].includes(user.role)) return res.status(403).json({ success: false, message: 'Only Super Admin can change administrator accounts' });
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
    if (req.user.role !== 'admin' && ['admin', 'college_admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Only Super Admin can assign administrative roles' });
    }
    if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    if (!['student', 'faculty', 'admin', 'college_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const query = { _id: req.params.id };
    if (req.collegeId) query.collegeIds = req.collegeId;
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: 'User not found in this college' });

    if (req.user.role !== 'admin' && ['admin', 'college_admin'].includes(user.role)) return res.status(403).json({ success: false, message: 'Only Super Admin can change administrator accounts' });
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
    if (!targetUser || targetUser.role !== 'student') return res.status(404).json({ success: false, message: 'Student not found in this college' });
    if (groupId && !await Group.exists({ _id: groupId, collegeId: req.collegeId })) return res.status(400).json({ success: false, message: 'Group must belong to the same college' });

    const prevStudent = await Student.findOne({ userId: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    if (prevStudent?.groupId && prevStudent.groupId.toString() !== (groupId || '').toString()) {
      await Group.findOneAndUpdate({ _id: prevStudent.groupId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) }, { $pull: { students: req.params.id } });
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) },
      { collegeId: req.collegeId || undefined, rollNumber, college: req.college?.name || '', course, branch, semester, groupId: groupId || null },
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
    const name = String(req.body.name || '').trim();
    const courseId = String(req.body.courseId || '').trim();
    if (!name || !isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: 'Category name and course are required' });
    }

    const course = await Course.findOne({ _id: courseId, ...collegeFilter(req) });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found in this college' });

    const category = await Category.create({
      collegeId: req.collegeId || undefined,
      courseId: course._id,
      name,
      description: req.body.description,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

exports.assignCategoryCourse = async (req, res, next) => {
  try {
    const courseId = String(req.body.courseId || '').trim();
    if (!isObjectId(courseId) || !isObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Valid category and course are required' });
    }

    const [category, course] = await Promise.all([
      Category.findOne({ _id: req.params.id, ...collegeFilter(req) }),
      Course.findOne({ _id: courseId, ...collegeFilter(req) }),
    ]);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found in this college' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found in this college' });

    category.courseId = course._id;
    await category.save();
    res.status(200).json({ success: true, category });
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
