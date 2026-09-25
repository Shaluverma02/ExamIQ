const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Category = require('../models/Category');
const Course = require('../models/Course');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const TestCase = require('../models/TestCase');
const Exam = require('../models/Exam');
const College = require('../models/College');
const Membership = require('../models/Membership');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_exam_db';

const requireEnv = (key) => {
  if (!process.env[key]) throw new Error(`${key} is required for production seeding`);
  return process.env[key];
};

const clearCollections = async () => {
  if (process.env.SEED_RESET_DATABASE !== 'true') return;

  await Promise.all([
    User.deleteMany(),
    Student.deleteMany(),
    Faculty.deleteMany(),
    Category.deleteMany(),
    Course.deleteMany(),
    Question.deleteMany(),
    CodingProblem.deleteMany(),
    TestCase.deleteMany(),
    Exam.deleteMany(),
    College.deleteMany(),
    Membership.deleteMany(),
  ]);
};

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding.');

    await clearCollections();

    const adminEmail = requireEnv('SEED_ADMIN_EMAIL').toLowerCase().trim();
    const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');
    const adminName = process.env.SEED_ADMIN_NAME || 'System Administrator';
    const collegeName = process.env.SEED_COLLEGE_NAME || process.env.DEFAULT_COLLEGE_NAME || 'Primary Institution';
    const collegeCode = (process.env.SEED_COLLEGE_CODE || 'PRIMARY').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const college = await College.findOneAndUpdate(
      { code: collegeCode },
      {
        name: collegeName,
        code: collegeCode,
        domain: process.env.SEED_COLLEGE_DOMAIN || '',
        contactEmail: process.env.SEED_COLLEGE_EMAIL || adminEmail,
        isActive: true,
        settings: {
          allowSelfRegistration: true,
          requireInviteCode: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isEmailVerified: true,
          isActive: true,
          activeCollegeId: college._id,
        },
        $addToSet: { collegeIds: college._id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    college.createdBy = admin._id;
    await college.save();

    await Membership.findOneAndUpdate(
      { userId: admin._id, collegeId: college._id },
      { userId: admin._id, collegeId: college._id, role: 'admin', status: 'active', createdBy: admin._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (process.env.SEED_WITH_REFERENCE_CONTENT === 'true') {
      const categoryName = process.env.SEED_CATEGORY_NAME || 'General Assessment';
      await Category.findOneAndUpdate(
        { name: categoryName, collegeId: college._id },
        { name: categoryName, collegeId: college._id, createdBy: admin._id },
        { upsert: true, new: true }
      );

      if (process.env.SEED_COURSE_NAME && process.env.SEED_COURSE_CODE) {
        await Course.findOneAndUpdate(
          { code: process.env.SEED_COURSE_CODE.toUpperCase().trim(), collegeId: college._id },
          {
            name: process.env.SEED_COURSE_NAME,
            code: process.env.SEED_COURSE_CODE.toUpperCase().trim(),
            collegeId: college._id,
            createdBy: admin._id,
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log('Seeding completed successfully.');
    console.log(`Admin account ready: ${admin.email}`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedData();
