const express = require('express');
const router = express.Router();
const {
  generateQuestions,
  saveGeneratedQuestions,
  analyzeCode,
  generateStudyRoadmap,
  getInterviewTopics,
  evaluateInterviewAnswer,
  getVersantAssessment,
  submitVersantSection,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/generate-questions', authorize('faculty', 'admin'), generateQuestions);
router.post('/save-generated-questions', authorize('faculty', 'admin'), saveGeneratedQuestions);
router.post('/analyze-code', analyzeCode);
router.post('/study-roadmap', generateStudyRoadmap);
router.get('/interview/topics', getInterviewTopics);
router.post('/interview/evaluate', evaluateInterviewAnswer);
router.get('/versant/assessment', getVersantAssessment);
router.post('/versant/submit', submitVersantSection);

module.exports = router;
