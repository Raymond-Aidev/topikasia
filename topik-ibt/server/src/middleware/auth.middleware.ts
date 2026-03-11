import { Request, Response, NextFunction } from 'express';
import { verifyExamineeToken, verifyAdminToken } from '../shared/utils/jwt';
import { AppError } from '../shared/types';

/**
 * 응시자 인증 미들웨어
 */
export function examAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, '인증 토큰이 필요합니다');
    }

    const token = authHeader.slice(7);
    const payload = verifyExamineeToken(token);
    req.examinee = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, '유효하지 않은 인증 토큰입니다'));
    }
  }
}

/**
 * 어드민 인증 미들웨어
 */
export function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, '관리자 인증 토큰이 필요합니다');
    }

    const token = authHeader.slice(7);
    const payload = verifyAdminToken(token);
    req.admin = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, '유효하지 않은 관리자 토큰입니다'));
    }
  }
}
