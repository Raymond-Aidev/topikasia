import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

const verifySchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  code: z.string().length(6, '인증코드는 6자리입니다'),
});

/**
 * POST /api/registration/verify-email
 * 이메일 인증코드 확인
 */
export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = verifySchema.parse(req.body);

    const users = await prisma.$queryRaw`
      SELECT "id", "verifyCode", "verifyExpiry", "isVerified"
      FROM "RegistrationUser"
      WHERE "email" = ${body.email}
      LIMIT 1
    ` as any[];

    if (users.length === 0) {
      throw new AppError(404, '등록된 이메일을 찾을 수 없습니다');
    }

    const user = users[0];

    if (user.isVerified) {
      res.json({ success: true, message: '이미 인증된 이메일입니다.' });
      return;
    }

    if (!user.verifyCode || !user.verifyExpiry) {
      throw new AppError(400, '인증코드가 발급되지 않았습니다. 회원가입을 다시 시도해주세요.');
    }

    if (new Date() > new Date(user.verifyExpiry)) {
      throw new AppError(400, '인증코드가 만료되었습니다. 회원가입을 다시 시도해주세요.');
    }

    if (user.verifyCode !== body.code) {
      throw new AppError(400, '인증코드가 일치하지 않습니다');
    }

    // 인증 완료 처리
    await prisma.$executeRaw`
      UPDATE "RegistrationUser"
      SET "isVerified" = true, "verifyCode" = NULL, "verifyExpiry" = NULL, "updatedAt" = NOW()
      WHERE "id" = ${user.id}
    `;

    res.json({ success: true, message: '이메일 인증이 완료되었습니다.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const message = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new AppError(400, `입력값 검증 실패: ${message}`));
    } else {
      next(err);
    }
  }
}
