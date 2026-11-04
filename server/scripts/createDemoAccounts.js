const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('../config/env');

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const College = require('../models/College');
const Membership = require('../models/Membership');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_exam_db';

async function setupDemoAccounts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Find or create an active default College
    let college = await College.findOne({ isActive: true });
    if (!college) {
      college = await College.create({
        name: 'ExamIQ University',
        code: 'EXAMIQ',
        domain: 'examiq.com',
        isActive: true,
        settings: {
          allowSelfRegistration: true,
          requireInviteCode: false,
        },
      });
      console.log('Created default college:', college.name);
    } else {
      console.log('Using existing college:', college.name, `(${college.code})`);
    }

    const demoUsers = [
      {
        name: 'Demo Admin',
        email: 'admin@examiq.com',
        password: 'Admin@123456',
        role: 'admin',
      },
      {
        name: 'Demo Faculty',
        email: 'faculty@examiq.com',
        password: 'Faculty@123456',
        role: 'faculty',
      },
      {
        name: 'Demo Student',
        email: 'student@examiq.com',
        password: 'Student@123456',
        role: 'student',
      },
      {
        name: 'Demo College Admin',
        email: 'collegeadmin@examiq.com',
        password: 'College@123456',
        role: 'college_admin',
      },
      {
        name: 'Demo Recruiter',
        email: 'recruiter@examiq.com',
        password: 'Recruiter@123456',
        role: 'recruiter',
      },
    ];

    const salt = await bcrypt.genSalt(10);

    for (const item of demoUsers) {
      const hashedPassword = await bcrypt.hash(item.password, salt);

      // Find or upsert user
      let user = await User.findOne({ email: item.email });
      if (user) {
        user.name = item.name;
        user.password = hashedPassword;
        user.role = item.role;
        user.isActive = true;
        user.isEmailVerified = true;
        user.isPhoneVerified = true;
        user.activeCollegeId = college._id;
        if (!user.collegeIds || !user.collegeIds.includes(college._id)) {
          user.collegeIds = [college._id];
        }
        await user.save();
        console.log(`Updated & Activated: ${item.email} (${item.role})`);
      } else {
        user = await User.create({
          name: item.name,
          email: item.email,
          password: hashedPassword,
          role: item.role,
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          activeCollegeId: college._id,
          collegeIds: [college._id],
        });
        console.log(`Created: ${item.email} (${item.role})`);
      }

      // Ensure Membership exists and is active
      await Membership.findOneAndUpdate(
        { userId: user._id, collegeId: college._id },
        {
          userId: user._id,
          collegeId: college._id,
          role: item.role === 'admin' ? 'admin' : item.role === 'college_admin' ? 'college_admin' : item.role === 'faculty' ? 'faculty' : 'student',
          status: 'active',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Ensure Student / Faculty sub-documents exist
      if (item.role === 'student') {
        await Student.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            collegeId: college._id,
            college: college.name,
            course: 'Computer Science & Engineering',
            branch: 'CSE',
            semester: '6',
            rollNumber: 'CS2026001',
            cgpa: '8.8',
            skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Data Structures'],
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else if (item.role === 'faculty') {
        await Faculty.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            collegeId: college._id,
            department: 'Computer Science & Engineering',
            designation: 'Associate Professor',
            employeeId: 'FAC202601',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    console.log('\n--- ALL DEMO ACCOUNTS CREATED & VERIFIED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up demo accounts:', error);
    process.exit(1);
  }
}

setupDemoAccounts();
