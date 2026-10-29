const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  requestPhoneVerification,
  verifyPhone,
  requestMagicLogin,
  magicLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validateAuth');

router.post('/register', validate.register, register);
router.post('/login', validate.login, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, validate.profile, updateProfile);
router.put('/change-password', protect, validate.changePassword, changePassword);
router.post('/forgot-password', validate.email, forgotPassword);
router.post('/reset-password/:resetToken', validate.reset, resetPassword);
router.post('/phone/request-code', validate.email, requestPhoneVerification);
router.post('/phone/verify', validate.phone, verifyPhone);
router.post('/magic-login', validate.email, requestMagicLogin);
router.get('/magic-login', magicLogin);

module.exports = router;
