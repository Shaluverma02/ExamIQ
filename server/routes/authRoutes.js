const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPasswordWithCode,
  resetPassword,
  requestPhoneVerification,
  verifyPhone,
  requestRegistrationCodes,
  verifyRegistration,
  requestMagicLogin,
  magicLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validateAuth');
const registrationOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many verification requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const registrationVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const passwordResetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const passwordResetVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validate.register, register);
router.post('/registration/request-codes', registrationOtpLimiter, validate.email, requestRegistrationCodes);
router.post('/registration/verify', registrationVerifyLimiter, validate.registrationOtp, verifyRegistration);
router.post('/login', validate.login, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, validate.profile, updateProfile);
router.put('/change-password', protect, validate.changePassword, changePassword);
router.post('/forgot-password', passwordResetRequestLimiter, validate.email, forgotPassword);
router.post('/reset-password/with-code', passwordResetVerifyLimiter, validate.resetWithCode, resetPasswordWithCode);
router.post('/reset-password/:resetToken', validate.reset, resetPassword);
router.post('/phone/request-code', validate.email, requestPhoneVerification);
router.post('/phone/verify', validate.phone, verifyPhone);
router.post('/magic-login', validate.email, requestMagicLogin);
router.get('/magic-login', magicLogin);

module.exports = router;
