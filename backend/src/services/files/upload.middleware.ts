import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import multer from "multer";
import path from "path";
import { env } from "../../config/env";
import {
  SUPPORTED_UPLOAD_EXTENSIONS,
  SUPPORTED_UPLOAD_MIME_TYPES,
} from "../../constants/upload.constants";
import { AppError } from "../../utils/app-error";

const uploadDirPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!existsSync(uploadDirPath)) {
  mkdirSync(uploadDirPath, { recursive: true });
}

function isSupportedFile(file: Express.Multer.File): boolean {
  const extension = path.extname(file.originalname).toLowerCase();
  return SUPPORTED_UPLOAD_MIME_TYPES.has(file.mimetype) || SUPPORTED_UPLOAD_EXTENSIONS.has(extension);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirPath);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

export const uploadSingleDocument = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!isSupportedFile(file)) {
      cb(new AppError("Unsupported file type. Allowed: PDF, TXT, Markdown, PNG, JPG, JPEG, WEBP", 400));
      return;
    }

    cb(null, true);
  },
}).single("file");

export { uploadDirPath };
