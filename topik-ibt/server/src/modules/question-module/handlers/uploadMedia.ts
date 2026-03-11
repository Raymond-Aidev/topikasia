import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../../../shared/types';
import { uploadToS3 } from '../../../shared/utils/s3';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * multer 미들웨어 설정
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(new AppError(400, `지원하지 않는 파일 형식입니다: ${file.mimetype}. 지원 형식: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`));
      return;
    }
    cb(null, true);
  },
}).single('file');

/**
 * POST /api/media/upload
 * 미디어 파일 업로드 (이미지, 오디오)
 */
export async function uploadMedia(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError(401, '관리자 인증이 필요합니다');
    }

    if (!req.file) {
      throw new AppError(400, '파일이 첨부되지 않았습니다');
    }

    const { mimetype, buffer, originalname } = req.file;
    const mediaType = ALLOWED_MIME_TYPES[mimetype];

    if (!mediaType) {
      throw new AppError(400, `지원하지 않는 파일 형식입니다: ${mimetype}`);
    }

    const prefix = `media/${mediaType}`;
    const url = await uploadToS3(buffer, mimetype, prefix);

    res.status(201).json({
      success: true,
      data: {
        url,
        originalName: originalname,
        mimeType: mimetype,
        size: buffer.length,
      },
    });
  } catch (err) {
    next(err);
  }
}
