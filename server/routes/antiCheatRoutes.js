const express = require('express');
const router = express.Router();
const { getExamAntiCheatAudit } = require('../controllers/antiCheatController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/exam/:examId', authorize('faculty', 'admin'), getExamAntiCheatAudit);

module.exports = router;
