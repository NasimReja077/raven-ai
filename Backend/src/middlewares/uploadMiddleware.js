// Backend/src/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ApiError from "../utils/ApiError.js"
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  FILE: 20 * 1024 * 1024, // 20MB for PDFs
};

const ALLOWED_TYPES = /jpeg|jpg|png|gif|webp|pdf/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads/');

    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix + '-' + safeFilename);
  },
});

const fileFilter = (req, file, cb) => {
  const extname = ALLOWED_TYPES.test(path.extname(file.originalname).toLowerCase());
  const mimetype = ALLOWED_TYPES.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, WebP and PDF files are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: FILE_SIZE_LIMITS.IMAGE },
  fileFilter,
});

export const uploadFile = multer({
  storage,
  limits: { fileSize: FILE_SIZE_LIMITS.FILE },
  fileFilter,
});