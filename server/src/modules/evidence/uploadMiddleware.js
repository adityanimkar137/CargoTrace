/**
 * CargoTrace Evidence Upload Middleware
 * Configures multer memory storage with file type allowlist and 10MB size limit.
 */
import multer from 'multer';
import { AppError } from '../../middleware/errorHandler.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new AppError(
        `Invalid file type (${file.mimetype}). Allowed types: images (JPEG, PNG, WebP) and documents (PDF, TXT, DOCX).`,
        400,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
  cb(null, true);
}

export const evidenceUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  },
  fileFilter
});
