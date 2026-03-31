// src/controllers/auth.controller.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { connection as redis } from "../config/redis.config.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendTokenResponse, generateAccessToken, refreshAccessToken, generateTokens} from "../utils/jwt.js";
import { generateOTP, generateOTPExpire, generateResetToken, generateResetTokenExpire } from "../utils/generateOTP.js";

import { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetConfirmation } from "../services/email.service.js";

// Signup controller

// @route   POST /api/auth/signup
// @access  Public

export const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const message =
        existingUser.email === email
          ? "Email already exists"
          : "Username already exists";
      return next(new ApiError(409, message));
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpire = generateOTPExpire(); // 1 hour 

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      otp,
      otpExpire,
      isVerified: false,
    });

    // Send OTP email
    await sendOTPEmail(user.email, user.username, otp);

    // Send token response
    sendTokenResponse(
      user,
      201,
      res,
      "Registration successful! Please verify your email with OTP"
    );
  } catch (error) {
    next(error);
  }
};

// Verify OTP controller

// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // 1. Check if both fields are provided
    if (!email || !otp) {
      return next(new ApiError(400, 'Please provide email and OTP'));
    }
    
    // 2. Find user and explicitly select hidden fields
    const user = await User.findOne({ email }).select('+otp +otpExpire');

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // 3. Check if already verified
    if (user.isVerified) {
      return next(new ApiError(400, 'The Email account is already verified'));
    }

    // Check OTP expiration
    // const otpExpire = generateOTPExpire(); // 1 hour

    if ( !user.otpExpire || user.otpExpire < Date.now()) { // 
      return next(new ApiError(400, 'OTP has expired. Please request a new one'));
    }

    // Check OTP validity
    if (user.otp !== otp) {
      return next(new ApiError(400, 'Invalid OTP'));
    }

    // Update user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    // Send welcome email
    try {
     await sendWelcomeEmail(email, user.username); 
    } catch (emailErr) {
      console.error("Welcome email failed to send:", emailErr.message);
    }

    // 8. Final Response -// Ensure Send token response
    sendTokenResponse(user, 200, res, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (user.isVerified) {
      return next(new ApiError(400, 'Email already verified'));
    }

    // // Throttle — max 1 OTP per 60 seconds
    // if (user.lastVerificationSentAt) {
    //   const secondsSinceLast = (Date.now() - user.lastVerificationSentAt.getTime()) / 1000;
    //   if (secondsSinceLast < 60) {
    //     return next(
    //       new ApiError(429, `Please wait ${Math.ceil(60 - secondsSinceLast)}s before requesting a new OTP`)
    //     );
    //   }
    // }

    // Generate new OTP

    const otp = generateOTP();
    const otpExpire = generateOTPExpire(); // 10 min

    user.otp = otp;
    user.otpExpire = otpExpire;
    user.lastVerificationSentAt = new Date();
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, user.username, otp);

    res.status(200).json(new ApiResponse(200, null, 'OTP sent successfully'));
  } catch (error) {
    next(error);
  }
};

// Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError(400, "Please provide email and password"));
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    // 3. Check if user exists BEFORE checking properties like isVerified
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    // Check if email is verified
    if (!user.isVerified) {
      return next(new ApiError(401, 'Please verify your email first'));
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    sendTokenResponse(user, 200, res, 'Login Successful');
  } catch (error) {
    next(error);
  }
};


// Refresh Access Token

// @route   POST /api/auth/refresh-token
// @access  Public  (requires refreshToken HttpOnly cookie)
export const refreshToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
 
    if (!incomingRefreshToken) {
      return next(new ApiError(401, "Refresh token not found. Please log in again."));
    }
 
    // Validate refresh token and get decoded payload // This also checks signature and expiry
    const { decoded } = refreshAccessToken(incomingRefreshToken);
 
    // Reject blacklisted tokens (user already logged out)
    const isBlacklisted = await redis.get(`blacklist:${incomingRefreshToken}`);

    if (isBlacklisted) {
      return next(new ApiError(401, "Token is no longer valid. Please log in again."));
    }
 
    const user = await User.findById(decoded.id); // decoded contains user ID and other info we put in the token payload
 
    if (!user) {
      return next(new ApiError(401, "User no longer exists. Please log in."));
    }
 
    if (!user.isVerified) {
      return next(new ApiError(401, "Please verify your email first."));
    }
 
    // Issue a fresh short-lived access token only
    // Generate new access token
    const newAccessToken = generateAccessToken(user);
 
    res.status(200).json(
      new ApiResponse(200, { accessToken: newAccessToken }, "Access token refreshed successfully")
    );
  } catch (error) {
    next(error);
  }
};

// Logout user

// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    const accessToken = req.token; // attached by protect middleware
    const refreshToken = req.cookies.refreshToken;
 
    // Blacklist access token for its remaining TTL
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken);
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.set(`blacklist:${accessToken}`, "true", "EX", ttl);
        }
      }
      } catch (err) {
        console.error("Error blacklisting access token:", err.message);
      }
    }
 
    // Blacklist refresh token too so /refresh-token is also invalidated
    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken);
      if (decoded?.exp) {
        // Store in Redis with TTL = remaining time until expiry
        const ttl = decoded.exp - Math.floor(Date.now() / 1000); // 
        if (ttl > 0) {
          await redis.set(`blacklist:${refreshToken}`, "true", "EX", ttl);
        }
      }
      } catch (error) {
        console.error("Error blacklisting refresh token:", err.message);
      }
    }
 
    const clearOptions = {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
 
    res
      .status(200)
      .cookie("refreshToken", "", clearOptions)
      .json(new ApiResponse(200, null, "Logout successful"));
  } catch (error) {
    next(error);
  }
};


// Forgot password

// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if(!email){
      return next(new ApiError(400, 'Email is required'));
    }

    const user = await User.findOne({ email });

    // if (!user) {
    //   return next(new ApiError(404, 'No user found with this email'));
    // }

    // Generic response — don't leak whether the email is registered
    if (!user) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, "If this email exists, a reset link has been sent"));
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpire = generateResetTokenExpire(); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpire = resetTokenExpire;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await sendPasswordResetEmail(email, resetUrl, user.username);

    res
      .status(200)
      .json(new ApiResponse(200, null, 'Password reset link sent to email'));
  } catch (error) {
    next(error);
  }
};

// Reset password

// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Basic validation
    if (!token) {
      return next(new ApiError(400, 'Reset token is required'));
    }

    if (!password) {
      return next(new ApiError(400, 'Please provide a new password'));
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired reset token'));
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined; // Clear the reset token // undefined is important to trigger mongoose "unset" behavior
    user.passwordResetTokenExpire = undefined; 
    // await user.save();
    await user.save({ validateBeforeSave: false });   // Skip validation if needed

    // Send confirmation email
    // await sendPasswordResetConfirmation(user.email, user.username);
    // 4. Send success email (non-blocking)
    try {
      await sendPasswordResetConfirmation(user.email, user.username);
    } catch (emailErr) {
      console.error("Reset confirmation email failed:", emailErr.message);
    }

    res
      .status(200)
      .json(new ApiResponse(200, null, 'Password reset successful'));
  } catch (error) {
    next(error);
  }
};

// current user

// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    
    const user = req.user;
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    res.status(200).json(
      new ApiResponse(200, { user }, 'User profile fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};