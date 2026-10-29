const express = require('express');
const router = express.Router();
const {
  getPublicColleges,
  getMyColleges,
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege,
  switchCollege,
  getCurrentCollege,
} = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/auth');
const validateCollege = require('../middleware/validateCollege');

router.get('/public', getPublicColleges);

router.use(protect);

router.get('/mine', getMyColleges);
router.get('/current', authorize('college_admin'), getCurrentCollege);
router.post('/switch', switchCollege);
router.get('/', authorize('admin'), getColleges);
router.post('/', authorize('admin'), createCollege);
router.delete('/:id', authorize('admin'), deleteCollege);
router.put('/:id', authorize('admin', 'college_admin'), validateCollege, updateCollege);

module.exports = router;
