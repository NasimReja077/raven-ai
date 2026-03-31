// Backend/src/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ApiError from "../utils/ApiError.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
};

const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads/');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}@-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const extname = ALLOWED_IMAGE_TYPES.test(path.extname(file.originalname).toLowerCase());
  const mimetype = ALLOWED_IMAGE_TYPES.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: FILE_SIZE_LIMITS.IMAGE },
  fileFilter,
});