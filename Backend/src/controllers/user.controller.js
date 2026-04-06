// src/controllers/user.controller.js

import { User } from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  imageUploadToCloudinary,
  imageDeleteFromCloudinary,
} from "../services/upload.service.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.config.js";

// @route PUT /api/users/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.user._id);
    if (username) user.username = username.trim();
    await user.save();
    res.status(200).json(
      new ApiResponse(200, {
        user: {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      }, "Profile updated successfully")
    );
  } catch (error) {
    next(error);
  }
};

// @route POST /api/users/avatar
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "No avatar file uploaded");

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");

    // Delete old avatar from Cloudinary
    if (user.publicId) {
      try {
        await imageDeleteFromCloudinary(user.publicId);
      } catch (err) {
        console.warn("Failed to delete old avatar:", err.message);
      }
    }

    // Upload new avatar
    const uploadResult = await imageUploadToCloudinary(
      req.file,
      CLOUDINARY_FOLDERS.AVATARS
    );

    user.avatar = uploadResult.url;
    user.publicId = uploadResult.publicId;
    await user.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          avatar: user.avatar,
          publicId: user.publicId,
        },
        "Avatar uploaded successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/users/password
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!user) throw new ApiError(404, "User not found");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(400, "Current password is incorrect");
    user.password = newPassword;
    await user.save();
    res.status(200).json(new ApiResponse(200, null, "Password updated successfully"));
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -otp -otpExpire -passwordResetToken -passwordResetExpire"
    );
    if (!user) return next(new ApiError(404, "User not found"));
    res.status(200).json(new ApiResponse(200, { user }, "Profile retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("username avatar createdAt");
    if (!user) throw new ApiError(404, "User not found");
    res.status(200).json(new ApiResponse(200, { user }, "Public profile fetched successfully"));
  } catch (error) {
    next(error);
  }
};