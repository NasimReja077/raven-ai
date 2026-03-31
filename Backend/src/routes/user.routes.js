import express from 'express';
import {
  updateProfile,
  uploadAvatar,
  updatePassword,
  getProfile,
  getPublicProfile
} from '../controllers/user.controller.js';
import protect from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import {
  updateProfileValidator,
  updatePasswordValidator,
  userIdValidator
} from '../validators/user.validator.js';

import validate from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Protected routes 
router.put('/profile', protect, updateProfileValidator, validate, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/password', protect, updatePasswordValidator, validate, updatePassword);
router.get('/profile', protect, getProfile);

// Public profile
router.get('/profile/:userId', userIdValidator, validate, getPublicProfile);
export default router;