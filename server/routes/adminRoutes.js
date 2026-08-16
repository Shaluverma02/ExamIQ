const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getUsers,
  toggleUserStatus,
  updateUserRole,
  updateStudentProfile,
  getFormSchemas,
  saveFormSchema,
  getCategories,
  createCategory,
  getCourses,
  createCourse,
  getAuditLogs,
  sendEmailBroadcast,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Public/Auth form fetching (allow without strict admin role for rendering forms)
router.get('/forms/public/:formType', getFormSchemas);

router.use(protect);

router.post('/send-email', authorize('admin', 'faculty'), sendEmailBroadcast);
router.get('/analytics', authorize('admin', 'faculty'), getAnalytics);
router.get('/categories', getCategories);
router.post('/categories', authorize('admin', 'faculty'), createCategory);
router.get('/courses', getCourses);
router.post('/courses', authorize('admin'), createCourse);

router.get('/users', authorize('admin', 'faculty'), getUsers);
router.put('/users/:id/toggle-status', authorize('admin'), toggleUserStatus);
router.put('/users/:id/role', authorize('admin'), updateUserRole);
router.put('/users/:id/student-profile', authorize('admin', 'faculty'), updateStudentProfile);

router.get('/forms', authorize('admin'), getFormSchemas);
router.get('/forms/:formType', getFormSchemas);
router.post('/forms', authorize('admin'), saveFormSchema);

router.get('/audit-logs', authorize('admin'), getAuditLogs);

module.exports = router;
