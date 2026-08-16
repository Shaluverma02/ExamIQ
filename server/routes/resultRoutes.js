const express = require('express');
const router = express.Router();
const {
  getResults,
  getResultById,
  getLeaderboard,
  getCertificates,
  verifyCertificate,
  exportResultsExcel,
  reEvaluateResult,
  deleteAttemptResult,
  getAssessmentStudentAttempts,
  getAssessmentResultStatistics,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.get('/certificates/verify/:certificateId', verifyCertificate);

router.get('/results/export/excel', protect, exportResultsExcel);
router.get('/assessments/:assessmentId/export/excel', protect, (req, res, next) => {
  req.query.examId = req.params.assessmentId;
  return exportResultsExcel(req, res, next);
});

router.put('/results/:id/re-evaluate', protect, authorize('admin', 'faculty'), reEvaluateResult);
router.get('/results', protect, getResults);
router.get('/results/:id', protect, getResultById);
router.delete('/results/:id', protect, authorize('admin', 'faculty'), deleteAttemptResult);

// Assessment-specific Result & Attempt routes
router.get('/assessments/:assessmentId/results', protect, (req, res, next) => {
  req.query.examId = req.params.assessmentId;
  return getResults(req, res, next);
});
router.get('/assessments/:assessmentId/attempts/:attemptId', protect, getResultById);
router.delete('/assessments/:assessmentId/attempts/:attemptId', protect, authorize('admin', 'faculty'), deleteAttemptResult);
router.get('/assessments/:assessmentId/students/:studentId/attempts', protect, getAssessmentStudentAttempts);
const { analyzeAssessmentPlagiarism } = require('../controllers/plagiarismController');
const { getLiveAssessmentMonitoring, forceTerminateStudentAttempt } = require('../controllers/liveMonitoringController');

router.get('/assessments/:assessmentId/plagiarism', protect, authorize('admin', 'faculty'), analyzeAssessmentPlagiarism);
router.get('/assessments/:assessmentId/live-monitor', protect, authorize('admin', 'faculty'), getLiveAssessmentMonitoring);
router.post('/assessments/:assessmentId/terminate-student', protect, authorize('admin', 'faculty'), forceTerminateStudentAttempt);

router.get('/leaderboard', protect, getLeaderboard);
router.get('/certificates', protect, getCertificates);

module.exports = router;
