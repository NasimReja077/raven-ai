import { User } from "../models/User.model.js";
// import { Favorite } from '../models/Favorite.model.js';
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  imageUploadToCloudinary,
  imageDeleteFromCloudinary,
} from "../services/upload.service.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.config.js";

// Update user profile
// @route   PUT /api/users/profile
// @access  Private

export const updateProfile = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.user._id);

    if (username) {
      user.username = username.trim();
    }

    await user.save();

    res.status(200).json(
      new ApiResponse(200, { 
        user: {
          user: {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        }
        } 
      }, 'Profile updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No avatar file uploaded');
    }

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, 'User not found');

    // Delete old avatar if exists and not default
    // if (user.avatar && !user.avatar.includes('default-avatar')) {
    //   try {
    //     // Extract public_id correctly (Cloudinary URLs usually end with /public_id.ext)
    //     const parts = user.avatar.split('/');
    //     const fileName = parts[parts.length - 1];
    //     const publicId = fileName.split('.')[0]; // remove extension

    //     await imageDeleteFromCloudinary(`${CLOUDINARY_FOLDERS.AVATARS}/${publicId}`);
    //   } catch (deleteError) {
    //     console.warn('Failed to delete old avatar:', deleteError.message);
    //     // Continue – don't fail the upload
    //   }
    // }

    // Delete old avatar if it's not the default one
    if (user.publicId) {
      try {
        await imageDeleteFromCloudinary(user.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete old avatar:', deleteError.message);
      }
    }

    // Upload new avatar
    const uploadResult = await imageUploadToCloudinary(req.file, CLOUDINARY_FOLDERS.AVATARS);

    user.avatar = uploadResult.secure_url;
    user.publicId = uploadResult.publicId; // Store the public ID for future deletions
    await user.save();

    res.status(200).json(
      new ApiResponse(200, { 
        avatar: user.avatar,
        publicId: user.publicId 
      }, 'Avatar uploaded successfully')
    );

  } catch (error) {
    next(error);
  }
};


// Update password
// @route   PUT /api/users/password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

    user.password = newPassword;
    await user.save();

    res.status(200).json(
      new ApiResponse(200, null, 'Password updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Get current user's full profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      '-password -otp -otpExpire -passwordResetToken -passwordResetExpire'
    );

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // // Enrich with extra stats (counts)
    // const [favoritesCount, reviewsCount, historyCount] = await Promise.all([
    //   Favorite.countDocuments({ user: user._id }),
    //   Review.countDocuments({ user: user._id }),
    //   WatchHistory.countDocuments({ user: user._id }),
    // ]);

    res.status(200).json(
      new ApiResponse(
        200, { user },
        'Profile retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};


// ─── Get Public Profile
export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'username avatar createdAt'
    );

    if (!user) throw new ApiError(404, 'User not found');


    res.status(200).json(
      new ApiResponse(200, { user }, 'Public profile fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};