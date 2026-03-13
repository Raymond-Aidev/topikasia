import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';
import { sendVerificationEmail } from '../../../shared/utils/email';

const SALT_ROUNDS = 12;
const VERIFY_CODE_EXPIRY_MINUTES = 3;

const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string().optional(),
});

/**
 * POST /api/registration/signup
 * 접수자 회원가입
 */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = signupSchema.parse(req.body);
    const email = body.email.toLowerCase().trim();

    const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);

    // 6자리 숫자 인증코드 생성
    const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
    const verifyExpiry = new Date(Date.now() + VERIFY_CODE_EXPIRY_MINUTES * 60 * 1000);

    // 기존 유저 확인
    const existing = await prisma.$queryRaw`
      SELECT "id", "email", "isVerified"
      FROM "RegistrationUser"
      WHERE LOWER("email") = ${email}
      LIMIT 1
    ` as any[];

    let created: { id: string; email: string };

    if (existing.length > 0) {
      const ex = existing[0];
      if (ex.isVerified) {
        throw new AppError(409, '이미 가입된 이메일입니다. 로그인해주세요.');
      }

      // 미인증 유저 → 정보 갱신 후 인증코드 재발급
      await prisma.$executeRaw`
        UPDATE "RegistrationUser"
        SET "passwordHash" = ${passwordHash}, "name" = ${body.name}, "phone" = ${body.phone || null},
            "verifyCode" = ${verifyCode}, "verifyExpiry" = ${verifyExpiry}, "updatedAt" = NOW()
        WHERE "id" = ${ex.id}
      `;
      created = { id: ex.id, email: ex.email };
    } else {
      try {
        const user = await prisma.$queryRaw`
          INSERT INTO "RegistrationUser" ("id", "email", "passwordHash", "name", "phone", "isVerified", "verifyCode", "verifyExpiry", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${email}, ${passwordHash}, ${body.name}, ${body.phone || null}, false, ${verifyCode}, ${verifyExpiry}, NOW(), NOW())
          RETURNING "id", "email"
        ` as any[];
        created = user[0];
      } catch (err: any) {
        if (err.code === 'P2002' || err.code === '23505') {
          throw new AppError(409, '이미 가입된 이메일입니다');
        }
        throw err;
      }
    }

    await sendVerificationEmail(email, verifyCode);

    res.status(201).json({
      success: true,
      message: '회원가입 완료. 이메일로 전송된 인증코드를 입력해주세요.',
      data: {
        userId: created.id,
        email: created.email,
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
