const express = require('express');
const router = express.Router();
const { generateQuestions, analyzeCode, generateStudyRoadmap } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/generate-questions', authorize('faculty', 'admin'), generateQuestions);
router.post('/analyze-code', analyzeCode);
router.post('/study-roadmap', generateStudyRoadmap);

module.exports = router;
