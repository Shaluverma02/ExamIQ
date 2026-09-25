const express = require('express');
const router = express.Router();
const {
  getGroups,
  getPublicGroups,
  getGroupById,
  createGroup,
  updateGroup,
  toggleGroupStatus,
  assignStudentsToGroup,
  deleteGroup,
} = require('../controllers/groupController');
const { protect, authorize } = require('../middleware/auth');

// Public route for student registration dropdown
router.get('/public', getPublicGroups);

router.use(protect);

router.get('/', authorize('admin', 'faculty', 'college_admin'), getGroups);
router.get('/:id', authorize('admin', 'faculty', 'college_admin'), getGroupById);
router.post('/', authorize('admin', 'college_admin', 'faculty'), createGroup);
router.put('/:id', authorize('admin', 'college_admin', 'faculty'), updateGroup);
router.delete('/:id', authorize('admin', 'college_admin'), deleteGroup);
router.put('/:id/toggle-status', authorize('admin', 'college_admin', 'faculty'), toggleGroupStatus);
router.post('/:id/students', authorize('admin', 'college_admin', 'faculty'), assignStudentsToGroup);

module.exports = router;
