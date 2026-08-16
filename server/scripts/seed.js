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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_exam_db';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Student.deleteMany();
    await Faculty.deleteMany();
    await Category.deleteMany();
    await Course.deleteMany();
    await Question.deleteMany();
    await CodingProblem.deleteMany();
    await TestCase.deleteMany();
    await Exam.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@examportal.edu',
      password: defaultPassword,
      role: 'admin',
      isEmailVerified: true,
    });

    // 2. Create Faculty
    const faculty = await User.create({
      name: 'Dr. Sarah Connor',
      email: 'faculty@examportal.edu',
      password: defaultPassword,
      role: 'faculty',
      isEmailVerified: true,
    });
    await Faculty.create({
      userId: faculty._id,
      department: 'Computer Science',
      designation: 'Associate Professor',
    });

    // 3. Create Student
    const student = await User.create({
      name: 'Alex Johnson',
      email: 'student@examportal.edu',
      password: defaultPassword,
      role: 'student',
      isEmailVerified: true,
    });
    await Student.create({
      userId: student._id,
      college: 'National Institute of Technology',
      course: 'B.Tech CS',
      branch: 'Computer Science & Engineering',
      semester: '6th',
      rollNumber: 'CS2024001',
    });

    // 4. Categories & Courses
    const catCS = await Category.create({ name: 'Data Structures & Algorithms', createdBy: admin._id });
    const catWeb = await Category.create({ name: 'Web Development', createdBy: admin._id });
    await Course.create({ name: 'Computer Science Essentials', code: 'CS101', createdBy: admin._id });

    // 5. Create Sample MCQs
    const q1 = await Question.create({
      questionText: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
      options: [
        { optionText: 'O(1)', isCorrect: false },
        { optionText: 'O(n)', isCorrect: false },
        { optionText: 'O(log n)', isCorrect: true },
        { optionText: 'O(n log n)', isCorrect: false },
      ],
      questionType: 'single',
      marks: 2,
      negativeMarks: 0.5,
      category: 'Data Structures & Algorithms',
      difficulty: 'easy',
      explanation: 'In a balanced BST, height is log2(n), hence search requires O(log n) comparisons.',
      createdBy: faculty._id,
    });

    const q2 = await Question.create({
      questionText: 'Which of the following data structures follows the Last In First Out (LIFO) principle?',
      options: [
        { optionText: 'Queue', isCorrect: false },
        { optionText: 'Stack', isCorrect: true },
        { optionText: 'Array', isCorrect: false },
        { optionText: 'LinkedList', isCorrect: false },
      ],
      questionType: 'single',
      marks: 2,
      negativeMarks: 0.5,
      category: 'Data Structures & Algorithms',
      difficulty: 'easy',
      createdBy: faculty._id,
    });

    const q3 = await Question.create({
      questionText: 'Which HTTP method is used to update an existing resource idempotently?',
      options: [
        { optionText: 'POST', isCorrect: false },
        { optionText: 'PUT', isCorrect: true },
        { optionText: 'GET', isCorrect: false },
        { optionText: 'DELETE', isCorrect: false },
      ],
      questionType: 'single',
      marks: 2,
      category: 'Web Development',
      difficulty: 'medium',
      createdBy: faculty._id,
    });

    // 6. Create Sample Coding Problems
    const cp1 = await CodingProblem.create({
      title: 'Two Sum Problem',
      description: 'Given an array of integers `nums` and an integer `target`, return the two numbers that sum up to `target`. Print the space-separated values.',
      inputFormat: 'Line 1: Space-separated array of integers.\nLine 2: Target sum integer.',
      outputFormat: 'Space separated pair of integers or NO match.',
      constraints: '2 <= N <= 10^4',
      examples: [
        { input: '2 7 11 15\n9', output: '2 7', explanation: '2 + 7 = 9' },
      ],
      difficulty: 'easy',
      category: 'Data Structures & Algorithms',
      marks: 10,
      timeLimit: 2,
      allowedLanguages: ['javascript', 'python', 'java', 'cpp', 'c'],
      starterCode: [
        {
          language: 'javascript',
          code: `const fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\\n');\nconst nums = input[0].split(' ').map(Number);\nconst target = Number(input[1]);\n// Write your solution here\nconsole.log("2 7");`,
        },
        {
          language: 'python',
          code: `import sys\nlines = sys.stdin.read().splitlines()\nnums = list(map(int, lines[0].split()))\ntarget = int(lines[1])\n# Write your code here\nprint("2 7")`,
        },
      ],
      createdBy: faculty._id,
    });

    // Test cases for CP1
    await TestCase.create([
      { codingProblemId: cp1._id, input: '2 7 11 15\n9', expectedOutput: '2 7', isHidden: false, weight: 1 },
      { codingProblemId: cp1._id, input: '3 2 4\n6', expectedOutput: '2 4', isHidden: true, weight: 1 },
      { codingProblemId: cp1._id, input: '3 3\n6', expectedOutput: '3 3', isHidden: true, weight: 1 },
    ]);

    const cp2 = await CodingProblem.create({
      title: 'Fibonacci Sequence Generator',
      description: 'Given an integer `N`, print the N-th Fibonacci number (where F(0)=0, F(1)=1).',
      inputFormat: 'Single line containing integer N.',
      outputFormat: 'Single integer F(N).',
      difficulty: 'easy',
      category: 'Data Structures & Algorithms',
      marks: 10,
      starterCode: [
        {
          language: 'python',
          code: `import sys\nn = int(sys.stdin.read().trim())\ndef fib(n):\n    if n <= 1: return n\n    a, b = 0, 1\n    for _ in range(2, n+1):\n        a, b = b, a + b\n    return b\nprint(fib(n))`,
        },
      ],
      createdBy: faculty._id,
    });

    await TestCase.create([
      { codingProblemId: cp2._id, input: '5', expectedOutput: '5', isHidden: false, weight: 1 },
      { codingProblemId: cp2._id, input: '10', expectedOutput: '55', isHidden: true, weight: 1 },
    ]);

    // 7. Create Sample Exam
    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    await Exam.create({
      title: 'Full-Stack & Algorithms Assessment 2026',
      description: 'Comprehensive test containing objective MCQs and programming challenges on Data Structures, Algorithms, and Web fundamentals.',
      category: 'Data Structures & Algorithms',
      facultyId: faculty._id,
      questions: [q1._id, q2._id, q3._id],
      codingProblems: [cp1._id, cp2._id],
      duration: 60, // 60 minutes
      startDate,
      endDate,
      totalMarks: 26, // 3 MCQs (6 marks) + 2 Coding (20 marks)
      passingMarks: 10,
      negativeMarking: true,
      status: 'published',
    });

    console.log('=====================================================');
    console.log('SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Demo Credentials Created:');
    console.log('Admin:    admin@examportal.edu    / password123');
    console.log('Faculty:  faculty@examportal.edu  / password123');
    console.log('Student:  student@examportal.edu  / password123');
    console.log('=====================================================');

    process.exit(0);
  } catch (err) {
    console.error('Seeding Failed:', err);
    process.exit(1);
  }
};

seedData();
