const mongoose = require('mongoose');

// =========================================================
// TEST RESULT SCHEMA
// =========================================================

const testResultSchema = new mongoose.Schema(
  {
    testCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
    },

    /*
     * Public test case:
     * actual input/output can be stored.
     *
     * Hidden test case:
     * controller should store masked values.
     */
    input: {
      type: String,
      default: '',
    },

    expectedOutput: {
      type: String,
      default: '',
    },

    actualOutput: {
      type: String,
      default: '',
    },

    status: {
      type: String,

      enum: [
        'Accepted',
        'Wrong Answer',
        'Compilation Error',
        'Runtime Error',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
        'Runtime Security Error',
        'Internal Judge Error',
      ],
    },

    executionTime: {
      type: Number,
      default: 0,
    },

    executionMemory: {
      type: Number,
      default: 0,
    },

    isHidden: {
      type: Boolean,
      default: false,
    },
  },

  {
    _id: false,
  }
);

// =========================================================
// SUBMISSION SCHEMA
// =========================================================

const codingSubmissionSchema = new mongoose.Schema(
  {
    // =====================================================
    // STUDENT
    // =====================================================

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // =====================================================
    // EXAM
    // =====================================================

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      default: null,
      index: true,
    },

    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      index: true,
    },

    // =====================================================
    // PROBLEM
    // =====================================================

    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
      index: true,
    },

    // =====================================================
    // LANGUAGE
    // =====================================================

    language: {
      type: String,
      enum: [
        'javascript',
        'python',
        'java',
        'cpp',
        'c',
      ],
      required: true,
    },

    // =====================================================
    // SOURCE CODE
    // =====================================================

    sourceCode: {
      type: String,
      required: true,
    },

    // =====================================================
    // FINAL STATUS
    // =====================================================

    status: {
      type: String,

      enum: [
        'Pending',
        'Accepted',
        'Wrong Answer',
        'Compilation Error',
        'Runtime Error',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
        'Runtime Security Error',
        'Internal Judge Error',
      ],

      default: 'Pending',
      index: true,
    },

    // =====================================================
    // SCORE
    // =====================================================

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // TEST CASE STATISTICS
    // =====================================================

    passedTestCases: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTestCases: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // EXECUTION STATISTICS
    // =====================================================

    executionTime: {
      type: Number,
      default: 0,
      min: 0,
      // milliseconds
    },

    memoryUsed: {
      type: Number,
      default: 0,
      min: 0,
      // KB
    },

    // =====================================================
    // ERROR
    // =====================================================

    errorMessage: {
      type: String,
      default: '',
    },

    // =====================================================
    // TEST RESULTS
    // =====================================================

    testResults: {
      type: [testResultSchema],
      default: [],
    },

    // =====================================================
    // SUBMISSION TYPE
    // =====================================================

    /*
     * run    = Run Code button
     * submit = Submit button
     */
    submissionType: {
      type: String,
      enum: ['run', 'submit'],
      default: 'submit',
      index: true,
    },

    // =====================================================
    // SUBMISSION NUMBER
    // =====================================================

    /*
     * Example:
     *
     * Submission #1
     * Submission #2
     * Submission #3
     */
    submissionNumber: {
      type: Number,
      default: 1,
    },

    // =====================================================
    // SUBMITTED AT
    // =====================================================

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },

  {
    timestamps: true,
  }
);

// =========================================================
// INDEXES
// =========================================================

// Student's submissions for a particular problem
codingSubmissionSchema.index({
  studentId: 1,
  problemId: 1,
  createdAt: -1,
});

// Student's submissions inside an exam
codingSubmissionSchema.index({
  studentId: 1,
  examId: 1,
  createdAt: -1,
});

// Problem statistics
codingSubmissionSchema.index({
  problemId: 1,
  status: 1,
});

// Latest submissions
codingSubmissionSchema.index({
  problemId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'CodingSubmission',
  codingSubmissionSchema
);
