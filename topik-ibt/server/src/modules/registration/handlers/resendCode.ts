import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';
import { sendVerificationEmail } from '../../../shared/utils/email';

const VERIFY_CODE_EXPIRY_MINUTES = 3;

const resendSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
});

/**
 * POST /api/registration/resend-code
 * 이메일 인증코드 재전송
 */
export async function resendCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = resendSchema.parse(req.body);

    const users = await prisma.$queryRaw`
      SELECT "id", "isVerified"
      FROM "RegistrationUser"
      WHERE "email" = ${body.email}
      LIMIT 1
    ` as any[];

    if (users.length === 0) {
      throw new AppError(404, '등록된 이메일을 찾을 수 없습니다');
    }

    const user = users[0];

    if (user.isVerified) {
      throw new AppError(400, '이미 인증된 이메일입니다. 로그인해주세요.');
    }

    // 새 인증코드 생성
    const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
    const verifyExpiry = new Date(Date.now() + VERIFY_CODE_EXPIRY_MINUTES * 60 * 1000);

    await prisma.$executeRaw`
      UPDATE "RegistrationUser"
      SET "verifyCode" = ${verifyCode}, "verifyExpiry" = ${verifyExpiry}, "updatedAt" = NOW()
      WHERE "id" = ${user.id}
    `;

    await sendVerificationEmail(body.email, verifyCode);

    res.json({
      success: true,
      message: '인증코드가 재전송되었습니다.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const message = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new AppError(400, `입력값 검증 실패: ${message}`));
    } else {
      next(err);
    }
  }
}
