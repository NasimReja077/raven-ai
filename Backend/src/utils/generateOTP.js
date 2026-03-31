// src/utils/generateOTP.js
import crypto from 'crypto';

// Generate a 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// 1 hour expiry for OTP
export const generateOTPExpire = () => {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}

// Generate password reset token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 1 hour expiry for password reset tokens
export const generateResetTokenExpire = () => {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour 
}

// Generate email verification token
export const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 24 hour expiry for email verification tokens
export const generateEmailVerificationTokenExpire = () => {
  return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
};