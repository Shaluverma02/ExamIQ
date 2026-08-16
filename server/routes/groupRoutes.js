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
router.use(authorize('admin', 'faculty'));

router.route('/').get(getGroups).post(createGroup);
router.route('/:id').get(getGroupById).put(updateGroup).delete(deleteGroup);
router.put('/:id/toggle-status', toggleGroupStatus);
router.post('/:id/students', assignStudentsToGroup);

module.exports = router;
