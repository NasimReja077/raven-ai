// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { connection as redis } from '../config/redis.config.js';
import ApiError from '../utils/ApiError.js';

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Try to get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Fallback: Check for access token in cookie (if you're also storing it there)
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } 
    // 3. Old fallback
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new ApiError(401, 'Unauthorized - Please log in to access this resource'));
    }

    // 2. Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(new ApiError(401, 'Token is no longer valid. Please log in again.'));
    }

    // 3. Verify the token (using JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Get user
    const user = await User.findById(decoded.id).select('-password -otp -otpExpire -passwordResetToken -passwordResetTokenExpire');

    if (!user) {
      return next(new ApiError(401, 'The user belonging to this token no longer exists'));
    }

    // 5. Attach to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Your session has expired. Please log in again'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid authentication token. Please log in again'));
    }

    return next(new ApiError(401, 'Authentication failed. Please log in again'));
  }
};

export default protect;