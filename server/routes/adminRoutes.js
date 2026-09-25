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
  getCollegeAdmins,
  createCollegeAdmin,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Public/Auth form fetching (allow without strict admin role for rendering forms)
router.get('/forms/public/:formType', getFormSchemas);

router.use(protect);

router.post('/send-email', authorize('admin', 'faculty', 'college_admin'), sendEmailBroadcast);
router.get('/analytics', authorize('admin', 'faculty', 'college_admin'), getAnalytics);
router.get('/categories', authorize('college_admin'), getCategories);
router.post('/categories', authorize('college_admin'), createCategory);
router.get('/courses', authorize('college_admin'), getCourses);
router.post('/courses', authorize('college_admin'), createCourse);

router.get('/users', authorize('admin', 'faculty', 'college_admin'), getUsers);
router.get('/college-admins', authorize('admin'), getCollegeAdmins);
router.post('/college-admins', authorize('admin'), createCollegeAdmin);
router.put('/users/:id/toggle-status', authorize('admin', 'college_admin'), toggleUserStatus);
router.put('/users/:id/role', authorize('admin', 'college_admin'), updateUserRole);
router.put('/users/:id/student-profile', authorize('admin', 'faculty', 'college_admin'), updateStudentProfile);

router.get('/forms', authorize('admin'), getFormSchemas);
router.get('/forms/:formType', getFormSchemas);
router.post('/forms', authorize('admin'), saveFormSchema);

router.get('/audit-logs', authorize('admin'), getAuditLogs);

module.exports = router;
