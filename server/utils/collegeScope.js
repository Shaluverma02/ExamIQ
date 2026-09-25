const mongoose = require('mongoose');

const getCollegeId = (req) => req.collegeId || req.user?.activeCollegeId || null;

const scopedQuery = (req, query = {}) => {
  const collegeId = getCollegeId(req);
  if (!collegeId) return query;
  return { ...query, collegeId };
};

const attachCollege = (req, data = {}) => {
  const collegeId = getCollegeId(req);
  if (!collegeId) return data;
  return { ...data, collegeId };
};

const matchesCollege = (doc, req) => {
  const collegeId = getCollegeId(req);
  if (!collegeId || !doc?.collegeId) return true;
  return doc.collegeId.toString() === collegeId.toString();
};

const toObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

module.exports = {
  getCollegeId,
  scopedQuery,
  attachCollege,
  matchesCollege,
  toObjectId,
};
