import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { comparePassword } from '../../shared/utils/password';
import { signExamineeToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/types';

const MAX_LOGIN_FAIL = 5;

/**
 * POST /api/exam-auth/login
 * 응시자 로그인 — ACID T1-01: loginFailCount 원자적 증가
 */
export async function examLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { loginId, password } = req.body;

    const examinee = await prisma.examinee.findUnique({
      where: { loginId },
    });

    if (!examinee) {
      throw new AppError(401, '아이디 또는 비밀번호가 올바르지 않습니다');
    }

    // 잠금 상태 확인
    if (examinee.status === 'LOCKED') {
      throw new AppError(423, '계정이 잠겼습니다. 감독관에게 문의하세요');
    }

    if (examinee.status === 'INACTIVE') {
      throw new AppError(403, '비활성화된 계정입니다');
    }

    // 비밀번호 비교
    const isValid = await comparePassword(password, examinee.passwordHash);

    if (!isValid) {
      // ACID T1-01: 원자적 increment로 loginFailCount 증가
      const updated = await prisma.examinee.update({
        where: { id: examinee.id },
        data: {
          loginFailCount: { increment: 1 },
          // 실패 횟수 초과 시 잠금 (현재 값 + 1 >= MAX)
          ...(examinee.loginFailCount + 1 >= MAX_LOGIN_FAIL && {
            status: 'LOCKED',
          }),
        },
      });

      const remaining = MAX_LOGIN_FAIL - updated.loginFailCount;
      if (remaining <= 0) {
        throw new AppError(423, '로그인 실패 횟수 초과로 계정이 잠겼습니다. 감독관에게 문의하세요');
      }
      throw new AppError(401, `아이디 또는 비밀번호가 올바르지 않습니다 (${remaining}회 남음)`);
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
