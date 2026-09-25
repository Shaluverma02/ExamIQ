const HiringDrive = require('../models/HiringDrive');
const Student = require('../models/Student');
const User = require('../models/User');
const Result = require('../models/Result');

const collegeScope = (req, query = {}) => {
  if (req.collegeId) return { ...query, collegeId: req.collegeId };
  return query;
};

const getCandidateRows = async (req) => {
  const students = await Student.find(collegeScope(req))
    .populate('userId', 'name email isActive')
    .populate('groupId', 'name code')
    .lean();
  const userIds = students.map((student) => student.userId?._id).filter(Boolean);
  const results = await Result.find(collegeScope(req, { studentId: { $in: userIds } }))
    .sort({ evaluatedAt: -1 })
    .lean();
  const latestResults = new Map();
  results.forEach((result) => {
    const key = String(result.studentId);
    if (!latestResults.has(key)) latestResults.set(key, result);
  });

  return students.filter((student) => student.userId).map((student) => {
    const result = latestResults.get(String(student.userId._id));
    const skills = Array.isArray(student.skills) ? student.skills : [];
    return {
      id: student.userId._id,
      name: student.userId.name,
      email: student.userId.email,
      college: student.college,
      course: student.course,
      group: student.groupId,
      skills,
      cgpa: student.cgpa || '',
      score: result?.percentage || 0,
      resultStatus: result?.status || 'Pending',
      resumeUrl: student.resumeUrl || '',
      profileLinks: {
        linkedin: student.linkedinUrl || '',
        github: student.githubUrl || '',
        portfolio: student.portfolioUrl || '',
      },
    };
  });
};

exports.getOverview = async (req, res, next) => {
  try {
    const [drives, candidates] = await Promise.all([
      HiringDrive.find(collegeScope(req, { recruiterId: req.user._id })).sort({ createdAt: -1 }).lean(),
      getCandidateRows(req),
    ]);
    const shortlisted = candidates.filter((candidate) => candidate.score >= 70).length;
    res.json({
      success: true,
      metrics: {
        activeDrives: drives.filter((drive) => drive.status === 'active').length,
        totalDrives: drives.length,
        shortlisted,
        plagiarismAlerts: 0,
        averageScore: candidates.length ? Math.round(candidates.reduce((sum, candidate) => sum + candidate.score, 0) / candidates.length) : 0,
      },
      drives,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDrives = async (req, res, next) => {
  try {
    const drives = await HiringDrive.find(collegeScope(req, { recruiterId: req.user._id })).sort({ createdAt: -1 });
    res.json({ success: true, drives });
  } catch (error) {
    next(error);
  }
};

exports.createDrive = async (req, res, next) => {
  try {
    const { name, assessmentType, batch, brief, status, eligibility } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Drive name is required' });
    const drive = await HiringDrive.create({
      recruiterId: req.user._id,
      collegeId: req.collegeId || null,
      name: name.trim(),
      assessmentType,
      batch,
      brief,
      status: status || 'draft',
      eligibility,
    });
    res.status(201).json({ success: true, drive });
  } catch (error) {
    next(error);
  }
};

exports.updateDrive = async (req, res, next) => {
  try {
    const { name, assessmentType, batch, brief, status, eligibility } = req.body;
    const drive = await HiringDrive.findOneAndUpdate(
      collegeScope(req, { _id: req.params.id, recruiterId: req.user._id }),
      { name, assessmentType, batch, brief, status, eligibility },
      { new: true, runValidators: true }
    );
    if (!drive) return res.status(404).json({ success: false, message: 'Hiring drive not found' });
    res.json({ success: true, drive });
  } catch (error) {
    next(error);
  }
};

exports.getCandidates = async (req, res, next) => {
  try {
    const candidates = await getCandidateRows(req);
    res.json({ success: true, candidates });
  } catch (error) {
    next(error);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const [drives, candidates] = await Promise.all([
      HiringDrive.find(collegeScope(req, { recruiterId: req.user._id })).lean(),
      getCandidateRows(req),
    ]);
    const scored = candidates.filter((candidate) => candidate.score > 0);
    res.json({
      success: true,
      reports: {
        totalDrives: drives.length,
        averageScore: scored.length ? Math.round(scored.reduce((sum, candidate) => sum + candidate.score, 0) / scored.length) : 0,
        shortlistConversion: candidates.length ? Math.round((candidates.filter((candidate) => candidate.score >= 70).length / candidates.length) * 100) : 0,
        reviewQueue: candidates.filter((candidate) => candidate.resultStatus === 'Pending').length,
      },
    });
  } catch (error) {
    next(error);
  }
};
