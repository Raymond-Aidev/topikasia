import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../../../config/database';
import { signRegistrationToken } from '../../../shared/utils/jwt';
import { AppError } from '../../../shared/types';

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

/**
 * POST /api/registration/login
 * 접수자 로그인
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    const users = await prisma.$queryRaw`
      SELECT "id", "email", "name", "passwordHash", "isVerified"
      FROM "RegistrationUser"
      WHERE LOWER("email") = LOWER(${body.email})
      LIMIT 1
    ` as any[];

    if (users.length === 0) {
      console.log(`[Login] 사용자 없음: ${body.email}`);
      throw new AppError(401, '이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const user = users[0];

    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      console.log(`[Login] 비밀번호 불일치: ${body.email}, hash길이=${user.passwordHash?.length}`);
      throw new AppError(401, '이메일 또는 비밀번호가 올바르지 않습니다');
    }

    if (!user.isVerified) {
      throw new AppError(403, '이메일 인증이 완료되지 않았습니다. 인증코드를 확인해주세요.');
    }

    const token = signRegistrationToken({
      sub: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
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
