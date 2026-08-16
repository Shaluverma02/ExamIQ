const express = require('express');
const router = express.Router();
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  startExamAttempt,
  saveAnswer,
  logAntiCheatEvent,
  submitExam,
  retakeAssessment,
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/:id/start', authorize('student'), startExamAttempt);
router.post('/:id/retake', authorize('student'), retakeAssessment);
router.post('/:id/answer', authorize('student'), saveAnswer);
router.post('/:id/anticheat', authorize('student'), logAntiCheatEvent);
router.post('/:id/submit', authorize('student'), submitExam);

router.route('/')
  .get(getExams)
  .post(authorize('faculty', 'admin'), createExam);

router.route('/:id')
  .get(getExamById)
  .put(authorize('faculty', 'admin'), updateExam)
  .delete(authorize('faculty', 'admin'), deleteExam);

module.exports = router;
