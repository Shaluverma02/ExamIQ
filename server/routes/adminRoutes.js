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
  assignCategoryCourse,
  getCourses,
  createCourse,
  getAuditLogs,
  sendEmailBroadcast,
  getCollegeAdmins,
  createCollegeAdmin,
  deleteCollegeAdmin,
  createFaculty,
  createStudent,
  importStudents,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validateAdmin');
const multer = require('multer');
const studentImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Public/Auth form fetching (allow without strict admin role for rendering forms)
router.get('/forms/public/:formType', getFormSchemas);

router.use(protect);

router.post('/send-email', authorize('admin', 'faculty', 'college_admin'), sendEmailBroadcast);
router.get('/analytics', authorize('admin', 'faculty', 'college_admin'), getAnalytics);
router.get('/categories', authorize('college_admin'), getCategories);
router.post('/categories', authorize('college_admin'), createCategory);
router.put('/categories/:id/course', authorize('college_admin'), assignCategoryCourse);
router.get('/courses', authorize('college_admin'), getCourses);
router.post('/courses', authorize('college_admin'), createCourse);

router.get('/users', authorize('admin', 'faculty', 'college_admin'), getUsers);
router.post('/faculty', authorize('college_admin'), validate.faculty, createFaculty);
router.post('/students', authorize('college_admin'), validate.student, createStudent);
router.post('/students/import', authorize('college_admin'), studentImportUpload.single('file'), importStudents);
router.get('/college-admins', authorize('admin'), getCollegeAdmins);
router.post('/college-admins', authorize('admin'), validate.collegeAdmin, createCollegeAdmin);
router.delete('/college-admins/:id', authorize('admin'), deleteCollegeAdmin);
router.put('/users/:id/toggle-status', authorize('admin', 'college_admin'), toggleUserStatus);
router.put('/users/:id/role', authorize('admin', 'college_admin'), updateUserRole);
router.put('/users/:id/student-profile', authorize('admin', 'faculty', 'college_admin'), updateStudentProfile);

router.get('/forms', authorize('admin'), getFormSchemas);
router.get('/forms/:formType', getFormSchemas);
router.post('/forms', authorize('admin'), saveFormSchema);

router.get('/audit-logs', authorize('admin', 'college_admin'), getAuditLogs);

module.exports = router;
