const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getOverview,
  getDrives,
  createDrive,
  updateDrive,
  getCandidates,
  getReports,
} = require('../controllers/recruiterController');

router.use(protect, authorize('recruiter'));
router.get('/overview', getOverview);
router.get('/drives', getDrives);
router.post('/drives', createDrive);
router.put('/drives/:id', updateDrive);
router.get('/candidates', getCandidates);
router.get('/reports', getReports);

module.exports = router;
