import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { comparePassword } from '../../shared/utils/password';
import { signExamineeToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/types';

/**
 * POST /api/exam-auth/login
 * 응시자 로그인
 * - 신규 수험자 (순차 번호): 수험번호만으로 인증 (비밀번호 없음)
 * - 기존 수험자: loginId + password 인증 (하위호환)
 */
export async function examLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { loginId, password } = req.body;

    if (!loginId) {
      throw new AppError(400, '수험번호를 입력하세요');
    }

    const examinee = await prisma.examinee.findUnique({
      where: { loginId },
    });

    if (!examinee) {
      throw new AppError(401, '수험번호가 올바르지 않습니다');
    }

    if (examinee.status === 'LOCKED') {
      throw new AppError(423, '계정이 잠겼습니다. 감독관에게 문의하세요');
    }

    if (examinee.status === 'INACTIVE') {
      throw new AppError(403, '비활성화된 계정입니다');
    }

    // 비밀번호가 없는 수험자 (NO_PASSWORD) → 수험번호만으로 인증
    const isPasswordless = examinee.passwordHash === 'NO_PASSWORD';

    if (!isPasswordless) {
      // 기존 수험자: 비밀번호 검증 (하위호환)
      if (!password) {
        throw new AppError(401, '비밀번호를 입력하세요');
      }

      const isValid = await comparePassword(password, examinee.passwordHash);
      if (!isValid) {
        throw new AppError(401, '수험번호 또는 비밀번호가 올바르지 않습니다');
      }
    }

    // 로그인 성공 → failCount 리셋
    await prisma.examinee.update({
      where: { id: examinee.id },
      data: { loginFailCount: 0 },
    });

    const token = signExamineeToken({
      sub: examinee.id,
      loginId: examinee.loginId,
    });

    res.json({
      success: true,
      data: {
        token,
        examinee: {
          id: examinee.id,
          loginId: examinee.loginId,
          name: examinee.name,
          registrationNumber: examinee.registrationNumber,
          seatNumber: examinee.seatNumber,
          photoUrl: examinee.photoUrl,
          institutionName: examinee.institutionName,
          examRoomName: examinee.examRoomName,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/exam-auth/me
 * 현재 로그인된 응시자 정보
 */
export async function examMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const examinee = await prisma.examinee.findUnique({
      where: { id: req.examinee.sub },
      select: {
        id: true,
        loginId: true,
        name: true,
        registrationNumber: true,
        seatNumber: true,
        photoUrl: true,
        institutionName: true,
        examRoomName: true,
        status: true,
        assignedExamSetId: true,
      },
    });

    if (!examinee) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    res.json({ success: true, data: examinee });
  } catch (err) {
    next(err);
  }
}
