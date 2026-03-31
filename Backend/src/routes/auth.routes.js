import express from 'express';
import {
  signup,
  verifyOTP,
  resendOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';
import {
  signupValidator,
  loginValidator,
  verifyOTPValidator,
  resendOTPValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validator.js';
import validate from'../middlewares/validationMiddleware.js';
import {authLimiter} from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

// Public routes

router.post('/signup', authLimiter, signupValidator, validate, signup);

router.post('/verify-otp', authLimiter, verifyOTPValidator, validate, verifyOTP);
router.post('/resend-otp', authLimiter, resendOTPValidator, validate, resendOTP);

router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validate, resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;