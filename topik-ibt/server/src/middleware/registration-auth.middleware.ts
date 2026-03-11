import { Request, Response, NextFunction } from 'express';
import { verifyRegistrationToken } from '../shared/utils/jwt';
import { AppError } from '../shared/types';

/**
 * 접수자 인증 미들웨어
 * 기존 응시자/어드민 인증과 분리된 별도 JWT 검증
 */
export function registrationAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, '인증 토큰이 필요합니다');
    }

    const token = authHeader.slice(7);
    const payload = verifyRegistrationToken(token);
    req.registrationUser = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, '유효하지 않은 인증 토큰입니다'));
    }
  }
}
