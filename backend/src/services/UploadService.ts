import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '@/utils/errors';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter - only accept images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Apenas imagens (JPEG, PNG, WebP) são permitidas'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export class UploadService {
  /**
   * Get public URL for uploaded file
   */
  getFileUrl(filename: string): string {
    // In production, this would return a CDN URL
    // For now, return relative path that will be served by Express static middleware
    return `/uploads/${filename}`;
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Validate and process image upload
   */
  async processImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestError('Nenhum arquivo foi enviado');
    }

    return this.getFileUrl(file.filename);
  }
}

export const uploadService = new UploadService();
