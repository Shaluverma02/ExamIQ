const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    // =====================================================
    // PROBLEM REFERENCE
    // =====================================================

    codingProblemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
      index: true,
    },

    // =====================================================
    // TEST INPUT / OUTPUT
    // =====================================================

    input: {
      type: String,
      required: true,
      default: '',
    },

    expectedOutput: {
      type: String,
      required: true,
    },

    // =====================================================
    // VISIBILITY
    // =====================================================

    /*
     * false = Student can see this test case
     * true  = Hidden from student
     */
    isHidden: {
      type: Boolean,
      default: true,
      index: true,
    },

    // =====================================================
    // SCORING
    // =====================================================

    weight: {
      type: Number,
      default: 1,
      min: 1,
    },

    // =====================================================
    // OPTIONAL ORDER
    // =====================================================

    /*
     * Determines order in which test cases
     * should appear/run.
     */
    order: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

// =========================================================
// INDEX
// =========================================================

testCaseSchema.index({
  codingProblemId: 1,
  order: 1,
});

module.exports = mongoose.model(
  'TestCase',
  testCaseSchema
);