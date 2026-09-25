const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  requestPhoneVerification,
  verifyPhone,
  requestMagicLogin,
  magicLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.post('/phone/request-code', requestPhoneVerification);
router.post('/phone/verify', verifyPhone);
router.post('/magic-login', requestMagicLogin);
router.get('/magic-login', magicLogin);

module.exports = router;
