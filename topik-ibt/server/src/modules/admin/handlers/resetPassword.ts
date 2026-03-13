import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

const SALT_ROUNDS = 12;
const TEMP_PASSWORD_LENGTH = 10;

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(TEMP_PASSWORD_LENGTH);
  let password = '';
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

/**
 * POST /api/admin/examinees/:id/reset-password
 * PATCH /api/admin/examinees/:id/password
 * 비밀번호 초기화
 * - body.password가 있으면 해당 비밀번호로 설정
 * - body.password가 없으면 임시 비밀번호 생성
 * - loginFailCount 초기화, 상태 ACTIVE
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const examinee = await prisma.examinee.findUnique({ where: { id } });
    if (!examinee) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    const newPassword = req.body?.password || generateTempPassword();
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.examinee.update({
      where: { id },
      data: {
        passwordHash,
        loginFailCount: 0,
        status: 'ACTIVE',
      },
    });

    res.json({
      success: true,
      data: {
        tempPassword: req.body?.password ? undefined : newPassword,
        message: req.body?.password
          ? '비밀번호가 변경되었습니다.'
          : '임시 비밀번호가 생성되었습니다. 응시자에게 안전하게 전달해주세요.',
      },
    });
  } catch (err) {
    next(err);
  }
}
