import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * DELETE /api/question-module/exam-sets/:id
 * 시험세트 삭제 (DRAFT / ARCHIVED 상태에서만 가능, 사용 중이면 삭제 불가)
 */
export async function deleteExamSet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError(401, '관리자 인증이 필요합니다');
    }

    const id = req.params.id as string;

    // 현재 시험세트 조회
    const existing = await prisma.examSet.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError(404, '시험세트를 찾을 수 없습니다');
    }

    // DRAFT 또는 ARCHIVED 상태에서만 삭제 가능
    if (existing.status !== 'DRAFT' && existing.status !== 'ARCHIVED') {
      throw new AppError(
        409,
        `현재 상태(${existing.status})에서는 삭제할 수 없습니다. DRAFT 또는 ARCHIVED 상태에서만 삭제가 가능합니다`,
      );
    }

    // 배정된 응시자 수 확인
    const assignedExamineeCount = await prisma.examinee.count({
      where: { assignedExamSetId: id },
    });

    // 시험 세션 수 확인
    const examSessionCount = await prisma.examSession.count({
      where: { examSetId: id },
    });

    // 사용 중이면 삭제 불가
    if (assignedExamineeCount > 0 || examSessionCount > 0) {
      throw new AppError(
        409,
        `사용 중인 시험세트는 삭제할 수 없습니다. 배정된 응시자: ${assignedExamineeCount}명, 시험 세션: ${examSessionCount}건`,
      );
    }

    // 삭제
    await prisma.examSet.delete({ where: { id } });

    res.json({
      success: true,
      message: '시험세트가 삭제되었습니다',
    });
  } catch (err) {
    next(err);
  }
}
