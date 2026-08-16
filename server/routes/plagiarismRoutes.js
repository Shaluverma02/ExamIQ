const express = require('express');
const router = express.Router();
const { analyzeAssessmentPlagiarism } = require('../controllers/plagiarismController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/exam/:examId', authorize('faculty', 'admin'), analyzeAssessmentPlagiarism);

module.exports = router;
