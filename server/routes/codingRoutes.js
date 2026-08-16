const express = require('express');
const router = express.Router();
const {
  getCodingProblems,
  getCodingProblemById,
  createCodingProblem,
  updateCodingProblem,
  deleteCodingProblem,
  runTrialCode,
  submitCode,
  startAssessmentSession,
  recordViolation,
} = require('../controllers/codingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/run', runTrialCode);
router.post('/submit', submitCode);
router.post('/assessment/start', startAssessmentSession);
router.post('/assessment/violation', recordViolation);

router.route('/')
  .get(getCodingProblems)
  .post(authorize('faculty', 'admin'), createCodingProblem);

router.route('/:id')
  .get(getCodingProblemById)
  .put(authorize('faculty', 'admin'), updateCodingProblem)
  .delete(authorize('faculty', 'admin'), deleteCodingProblem);

module.exports = router;
