const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
    },

    output: {
      type: String,
      required: true,
    },

    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const starterCodeSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp', 'c'],
      required: true,
    },

    code: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const codingProblemSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC
    // =====================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    // =====================================================
    // PROBLEM STATEMENT
    // =====================================================

    inputFormat: {
      type: String,
      default: '',
    },

    outputFormat: {
      type: String,
      default: '',
    },

    constraints: {
      type: String,
      default: '',
    },

    examples: {
      type: [exampleSchema],
      default: [],
    },

    // =====================================================
    // CLASSIFICATION
    // =====================================================

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
      index: true,
    },

    category: {
      type: String,
      default: 'Data Structures',
      index: true,
    },

    topic: {
      type: String,
      default: 'Arrays',
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    // =====================================================
    // EVALUATION
    // =====================================================

    marks: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },

    timeLimit: {
      type: Number,
      default: 2,
      min: 1,
    },

    memoryLimit: {
      type: Number,
      default: 128,
      min: 16,
    },

    // =====================================================
    // LANGUAGES
    // =====================================================

    allowedLanguages: {
      type: [String],

      default: [
        'javascript',
        'python',
        'java',
        'cpp',
        'c',
      ],
    },

    starterCode: {
      type: [starterCodeSchema],
      default: [],
    },

    // =====================================================
    // LEETCODE STYLE SETTINGS
    // =====================================================

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    acceptanceRate: {
      type: Number,
      default: 0,
    },

    totalSubmissions: {
      type: Number,
      default: 0,
    },

    acceptedSubmissions: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // OWNERSHIP
    // =====================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

// =========================================================
// AUTO SLUG
// =========================================================

codingProblemSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    const baseSlug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Append short timestamp/random suffix if needed to guarantee uniqueness
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.slug = `${baseSlug}-${randomSuffix}`;
  }

  next();
});

// =========================================================
// INDEXES
// =========================================================

codingProblemSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

codingProblemSchema.index({
  difficulty: 1,
  category: 1,
  topic: 1,
});

module.exports = mongoose.model(
  'CodingProblem',
  codingProblemSchema
);