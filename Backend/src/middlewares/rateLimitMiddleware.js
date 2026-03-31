import rateLimit from 'express-rate-limit';

// Auth rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // limit 20 req
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});


// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit 100 req 
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
