const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getMyAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  getStudentAssignedExams,
  getEligibleStudentCount,
} = require('../controllers/examAssignmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/faculty', authorize('faculty', 'admin'), getMyAssignments);
router.get('/student', authorize('student'), getStudentAssignedExams);
router.get('/eligible-count', authorize('faculty', 'admin'), getEligibleStudentCount);

router.post('/', authorize('faculty', 'admin'), createAssignment);

router.post('/:id/publish', authorize('faculty', 'admin'), publishAssignment);

router
  .route('/:id')
  .get(getAssignmentById)
  .put(authorize('faculty', 'admin'), updateAssignment)
  .delete(authorize('faculty', 'admin'), deleteAssignment);

module.exports = router;
