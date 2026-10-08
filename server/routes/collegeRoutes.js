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
} = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/public', getPublicColleges);

router.use(protect);

router.get('/mine', getMyColleges);
router.post('/switch', switchCollege);
router.get('/', authorize('admin'), getColleges);
router.post('/', authorize('admin'), createCollege);
router.delete('/:id', authorize('admin'), deleteCollege);
router.put('/:id', authorize('admin', 'college_admin'), updateCollege);

module.exports = router;
