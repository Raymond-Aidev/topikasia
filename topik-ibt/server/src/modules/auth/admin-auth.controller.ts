import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { comparePassword } from '../../shared/utils/password';
import { signAdminToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/types';
import { env } from '../../config/env';

/**
 * POST /api/admin-auth/login
 * 어드민 로그인
 */
export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { loginId, password, twoFactorCode } = req.body;

    const admin = await prisma.adminUser.findUnique({
      where: { loginId },
    });

    if (!admin) {
      throw new AppError(401, '아이디 또는 비밀번호가 올바르지 않습니다');
    }

    if (!admin.isActive) {
      throw new AppError(403, '비활성화된 관리자 계정입니다');
    }

    const isValid = await comparePassword(password, admin.passwordHash);
    if (!isValid) {
      throw new AppError(401, '아이디 또는 비밀번호가 올바르지 않습니다');
    }

    // 2FA 검증 (ADMIN_2FA_CODE가 설정된 경우에만)
    if (env.ADMIN_2FA_CODE) {
      if (!twoFactorCode || twoFactorCode !== env.ADMIN_2FA_CODE) {
        throw new AppError(401, '2단계 인증 코드가 올바르지 않습니다');
      }
    }

    const token = signAdminToken({
      sub: admin.id,
      loginId: admin.loginId,
      role: admin.role,
    });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          loginId: admin.loginId,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin-auth/me
 * 현재 로그인된 관리자 정보
 */
export async function adminMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError(401, '관리자 인증이 필요합니다');
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin.sub },
      select: {
        id: true,
        loginId: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin) {
      throw new AppError(404, '관리자를 찾을 수 없습니다');
    }

    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
}
