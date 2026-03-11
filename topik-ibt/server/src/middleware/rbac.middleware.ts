import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@prisma/client';
import { AppError } from '../shared/types';

/**
 * 어드민 역할 기반 접근 제어 미들웨어
 * adminAuth 미들웨어 이후에 사용해야 합니다.
 */
export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(new AppError(401, '관리자 인증이 필요합니다'));
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      next(new AppError(403, '접근 권한이 없습니다'));
      return;
    }

    next();
  };
}
