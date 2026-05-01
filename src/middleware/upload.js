import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const FIVE_MB = 5 * 1024 * 1024;

const getExtensionFromMime = (mimetype) => {
  switch (mimetype) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'application/pdf':
      return 'pdf';
    default:
      return null;
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id;
    if (!userId) {
      return cb(new Error('Unauthorized: user context missing'));
    }

    const uploadDir = path.join(process.cwd(), 'uploads', userId);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = getExtensionFromMime(file.mimetype);
    if (!ext) {
      return cb(new Error('Unsupported file type'));
    }

    cb(null, `${uuidv4()}.${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP, and PDF files are allowed'));
  }

  cb(null, true);
};

export const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FIVE_MB
  }
}).single('receipt');
