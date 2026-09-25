const Group = require('../models/Group');
const Student = require('../models/Student');
const User = require('../models/User');
const ExamAssignment = require('../models/ExamAssignment');
const Result = require('../models/Result');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get public groups by college (for student registration dropdown)
// @route   GET /api/groups/public
// @access  Public
exports.getPublicGroups = async (req, res, next) => {
  try {
    const { college, collegeId } = req.query;
    const query = { isActive: true };

    if (collegeId) {
      query.collegeId = collegeId;
    } else if (college) {
      query.college = { $regex: `^${escapeRegex(college.trim())}$`, $options: 'i' };
    }

    const groups = await Group.find(query)
      .select('name code college course department semester section academicYear isActive')
      .sort({ name: 1 });

    // Also get distinct list of colleges available
    const distinctColleges = await Group.distinct('college', { isActive: true });

    res.status(200).json({
      success: true,
      count: groups.length,
      groups,
      colleges: distinctColleges,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all student groups with filtering
// @route   GET /api/groups
// @access  Private (Admin, Faculty)
exports.getGroups = async (req, res, next) => {
  try {
    const { college, course, department, semester, isActive, search } = req.query;
    const query = req.collegeId ? { collegeId: req.collegeId } : {};

    if (college) query.college = { $regex: escapeRegex(college), $options: 'i' };
    if (course) query.course = { $regex: escapeRegex(course), $options: 'i' };
    if (department) query.department = { $regex: escapeRegex(department), $options: 'i' };
    if (semester) query.semester = semester;
    if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { code: { $regex: escapeRegex(search), $options: 'i' } },
        { college: { $regex: escapeRegex(search), $options: 'i' } },
        { course: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    const groups = await Group.find(query)
      .populate('students', 'name email role phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: groups.length, groups });
  } catch (err) {
    next(err);
  }
};

// @desc    Get group details by ID (including enrolled students & performance)
// @route   GET /api/groups/:id
// @access  Private (Admin, Faculty)
exports.getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .populate('students', 'name email role phone createdAt')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Get student profiles for enrolled students
    const studentUserIds = group.students.map((s) => s._id);
    const studentProfiles = await Student.find({ userId: { $in: studentUserIds } });
    const profileMap = {};
    studentProfiles.forEach((sp) => {
      profileMap[sp.userId.toString()] = sp;
    });

    const enrolledStudents = group.students.map((s) => ({
      ...s.toObject(),
      profile: profileMap[s._id.toString()] || null,
    }));

    // Get exams assigned to this group
    const assignedExams = await ExamAssignment.find({ groupIds: group._id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .populate('examId', 'title category duration totalMarks status')
      .populate('facultyId', 'name email');

    // Get exam results for students in this group
    const groupResults = await Result.find({ studentId: { $in: studentUserIds }, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
      .populate('examId', 'title')
      .populate('studentId', 'name email');

    const totalStudents = enrolledStudents.length;
    const totalExamsAssigned = assignedExams.length;

    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    let passCount = 0;
    let failCount = 0;

    if (groupResults.length > 0) {
      const scores = groupResults.map((r) => r.percentage || 0);
      averageScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
      passCount = groupResults.filter((r) => r.status === 'Pass').length;
      failCount = groupResults.filter((r) => r.status === 'Fail').length;
    }

    res.status(200).json({
      success: true,
      group: {
        ...group.toObject(),
        students: enrolledStudents,
      },
      assignedExams,
      stats: {
        totalStudents,
        totalExamsAssigned,
        totalAttempts: groupResults.length,
        averageScore,
        highestScore,
        lowestScore,
        passCount,
        failCount,
      },
      results: groupResults,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new group
// @route   POST /api/groups
// @access  Private (Admin, Faculty)
exports.createGroup = async (req, res, next) => {
  try {
    const {
      name,
      code,
      course = '',
      department = '',
      semester = '',
      section = '',
      academicYear = '',
      description = '',
      isActive = true,
      students = [],
    } = req.body;

    if (!req.collegeId || !req.college?.name) {
      return res.status(400).json({ success: false, message: 'Select an active college workspace before creating a group' });
    }

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Group name and code are required' });
    }

    const college = req.college.name;

    // Check duplicate code within the same college
    const existing = await Group.findOne({
      ...(req.collegeId ? { collegeId: req.collegeId } : {}),
      college: { $regex: `^${college.trim()}$`, $options: 'i' },
      code: code.toUpperCase().trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Group code '${code.toUpperCase()}' already exists for college '${college}'`,
      });
    }

    const group = await Group.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      collegeId: req.collegeId || undefined,
      college: college.trim(),
      course: course.trim(),
      department: department.trim(),
      semester: semester.trim(),
      section: section.trim(),
      academicYear: academicYear.trim(),
      description: description.trim(),
      isActive: isActive !== false,
      students,
      createdBy: req.user._id,
    });

    // Update students' groupId
    if (students.length > 0) {
      await Student.updateMany(
        { userId: { $in: students } },
        { $set: { groupId: group._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate group code in this college',
      });
    }
    next(err);
  }
};

// @desc    Update group details
// @route   PUT /api/groups/:id
// @access  Private (Admin, Faculty)
exports.updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const {
      name,
      code,
      college,
      course,
      department,
      semester,
      section,
      academicYear,
      description,
      isActive,
      students,
    } = req.body;

    if (code && code.toUpperCase() !== group.code) {
      const targetCollege = college || group.college;
      const existing = await Group.findOne({
        _id: { $ne: group._id },
        ...(req.collegeId ? { collegeId: req.collegeId } : {}),
        college: { $regex: `^${targetCollege.trim()}$`, $options: 'i' },
        code: code.toUpperCase().trim(),
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Group code '${code.toUpperCase()}' already exists for college '${targetCollege}'`,
        });
      }
      group.code = code.toUpperCase().trim();
    }

    if (name) group.name = name.trim();
    if (college) group.college = college.trim();
    if (course) group.course = course.trim();
    if (department) group.department = department.trim();
    if (semester) group.semester = semester.trim();
    if (section) group.section = section.trim();
    if (academicYear) group.academicYear = academicYear.trim();
    if (description !== undefined) group.description = description;
    if (isActive !== undefined) group.isActive = isActive;
    if (students !== undefined) group.students = students;

    await group.save();

    // Sync student groupId
    if (students !== undefined) {
      await Student.updateMany({ groupId: group._id }, { $set: { groupId: null } });
      await Student.updateMany({ userId: { $in: students } }, { $set: { groupId: group._id } });
    }

    res.status(200).json({ success: true, message: 'Group updated successfully', group });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Group Active / Inactive Status
// @route   PUT /api/groups/:id/toggle-status
// @access  Private (Admin, Faculty)
exports.toggleGroupStatus = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    group.isActive = !group.isActive;
    await group.save();

    res.status(200).json({
      success: true,
      message: `Group ${group.isActive ? 'activated' : 'deactivated'} successfully`,
      group,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign students to group
// @route   POST /api/groups/:id/students
// @access  Private (Admin, Faculty)
exports.assignStudentsToGroup = async (req, res, next) => {
  try {
    const { studentIds = [] } = req.body;
    const group = await Group.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    group.students = studentIds;
    await group.save();

    // Sync Student model groupId
    await Student.updateMany({ groupId: group._id }, { $set: { groupId: null } });
    await Student.updateMany({ userId: { $in: studentIds } }, { $set: { groupId: group._id } });

    res.status(200).json({ success: true, message: 'Group roster updated', group });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private (Admin, Faculty)
exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Remove groupId from Student records
    await Student.updateMany({ groupId: group._id }, { $set: { groupId: null } });

    await group.deleteOne();
    res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (err) {
    next(err);
  }
};
