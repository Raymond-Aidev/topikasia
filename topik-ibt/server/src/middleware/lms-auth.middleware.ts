import { Request, Response, NextFunction } from 'express';
import { verifyExamineeToken, verifyRegistrationToken } from '../shared/utils/jwt';
import { prisma } from '../config/database';
import { AppError } from '../shared/types';

/**
 * LMS 인증 미들웨어
 * examToken 또는 registrationToken 둘 다 허용
 * registrationToken인 경우 연결된 Examinee를 조회하여 req.examinee에 설정
 */
export async function lmsAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
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

      // RegistrationUser와 연결된 Examinee 찾기 (승인된 접수 → examineeId)
      const registrations = await prisma.$queryRaw`
        SELECT "examineeId" FROM "Registration"
        WHERE "userId" = ${regPayload.sub} AND "status" = 'APPROVED' AND "examineeId" IS NOT NULL
        LIMIT 1
      ` as any[];

      if (registrations.length > 0) {
        // 연결된 Examinee가 있으면 해당 정보로 설정
        const examineeId = registrations[0].examineeId;
        req.examinee = { sub: examineeId, loginId: '', role: 'examinee' };
      }
      // Examinee가 없어도 인증은 통과 (이력 없음으로 표시)

      next();
      return;
    } catch {
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
