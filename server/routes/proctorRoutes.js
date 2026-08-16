const express = require('express');
const router = express.Router();
const {
  postHeartbeat,
  getLiveSessions,
  sendWarning,
} = require('../controllers/proctorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/heartbeat', postHeartbeat);
router.get('/live-sessions/:examId', authorize('admin', 'faculty'), getLiveSessions);
router.post('/send-warning', authorize('admin', 'faculty'), sendWarning);

module.exports = router;
