// src/utils/jwt.js
import jwt from "jsonwebtoken";
import ApiError from "./ApiError.js";
 
// -TOKEN GENERATORS
 
/**
 * Generate a short-lived access token
 * Payload: { id, email, role }
 */

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "15m" }
  );
};


/**
 * Generate a long-lived refresh token
 * Payload: { id } — minimal, only used to re-issue access tokens
 */


export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d" }
  );
};

/**
 * Generate a verification token for email OTP flow
 * Payload: { id, email, purpose: "verification" }
 */
export const generateVerificationToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      purpose: "verification",
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};


// VERIFY
/**
 * Verify any JWT — throws ApiError on failure so callers don't need try/catch
 */
export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token has expired");
    }
    throw new ApiError(401, "Invalid token");
  }
};
 


// GENERATE BOTH TOKENS AT ONCE
 
/**
 * generateTokens(user)
 * Returns { accessToken, refreshToken }
 * Use this on: login, signup, token refresh
 */

export const generateTokens = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { accessToken, refreshToken };
};
 

// REFRESH ACCESS TOKEN

/**
 * refreshAccessToken(refreshToken)
 *
 * Verifies the refresh token, returns a fresh access token.
 * Called by: POST /api/auth/refresh-token
 *
 * Flow:
 *   1. Verify refresh token signature + expiry
 *   2. Decode payload to get user id
 *   3. Caller should look up the user in DB (to check isBanned, isVerified etc.)
 *   4. Returns new accessToken + the decoded payload
 */

export const refreshAccessToken = (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
 
  // Verify with the refresh secret
  const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
 
  return { decoded}
};
 

// SEND TOKEN RESPONSE  (sets HttpOnly cookie + JSON body)
 
/**
 * sendTokenResponse(user, statusCode, res, message)
 *
 * Generates both tokens, sets refresh token as HttpOnly cookie,
 * returns access token in JSON body.
 *
 * Why split?
 *   - Access token in body  → JS can read it, attach to Authorization header
 *   - Refresh token in cookie → HttpOnly, JS can't read, XSS-safe
 */

export const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const { accessToken, refreshToken } = generateTokens(user);
 
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.JWT_COOKIE_EXPIRE) || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,                                   // XSS shield
    secure: process.env.NODE_ENV === "production",   // HTTPS only in prod
    sameSite: "strict",                              // CSRF shield
  };
 
  res
    .status(statusCode)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      message,
      accessToken,   // client stores this in memory (NOT localStorage)
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
};