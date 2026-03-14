import { Request, Response, NextFunction } from 'express';
import { verifyExamineeToken, verifyAdminToken, verifyRegistrationToken } from '../shared/utils/jwt';
import { prisma } from '../config/database';
import { AppError } from '../shared/types';

/**
 * 응시자 인증 미들웨어
 * examToken 또는 registrationToken 둘 다 허용
 * registrationToken인 경우 승인된 접수의 Examinee를 조회하여 req.examinee에 설정
 */
export async function examAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, '인증 토큰이 필요합니다');
    }

    const token = authHeader.slice(7);

    // 1) examToken 시도
    try {
      const payload = verifyExamineeToken(token);
      if (payload.role === 'examinee') {
        req.examinee = payload;
        next();
        return;
      }
    } catch {
      // examToken이 아님 → registrationToken 시도
    }

    // 2) registrationToken 시도
    try {
      const regPayload = verifyRegistrationToken(token);
      req.registrationUser = regPayload;

      // 승인된 접수의 Examinee 찾기
      const registrations = await prisma.$queryRaw`
        SELECT "examineeId" FROM "Registration"
        WHERE "userId" = ${regPayload.sub} AND "status" = 'APPROVED' AND "examineeId" IS NOT NULL
        LIMIT 1
      ` as any[];

      if (registrations.length > 0) {
        const examineeId = registrations[0].examineeId;
        req.examinee = { sub: examineeId, loginId: '', role: 'examinee' };
        next();
        return;
      }

      throw new AppError(403, '승인된 시험 접수가 없습니다. 시험 접수 후 관리자 승인을 받아주세요.');
    } catch (err) {
      if (err instanceof AppError) throw err;
      // registrationToken도 아님
    }

    throw new AppError(401, '유효하지 않은 인증 토큰입니다');
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
