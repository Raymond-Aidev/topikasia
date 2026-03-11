import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * PUT /api/admin/examinees/:id/exam-set
 * 시험세트 변경
 * ACID T2-06: 진행 중인 세션이 있으면 409
 * ACID T3-05: ACTIVE 상태의 세트만 배정 가능
 */
export async function changeExamSet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { examSetId } = req.body;

    if (!examSetId) {
      throw new AppError(400, '시험세트 ID를 입력해주세요');
    }

    const result = await prisma.$transaction(async (tx) => {
      const examinee = await tx.examinee.findUnique({ where: { id } });
      if (!examinee) {
        throw new AppError(404, '응시자를 찾을 수 없습니다');
      }

      // ACID T2-06: 진행 중인 세션 확인
      const activeSession = await tx.examSession.findFirst({
        where: {
          examineeId: id,
          status: 'IN_PROGRESS',
        },
      });
      if (activeSession) {
        throw new AppError(409, '진행 중인 시험이 있어 시험세트를 변경할 수 없습니다');
      }

      // ACID T3-05: ACTIVE 상태 확인
      const examSet = await tx.examSet.findUnique({
        where: { id: examSetId },
        select: { id: true, name: true, status: true },
      });
      if (!examSet) {
        throw new AppError(404, '시험세트를 찾을 수 없습니다');
      }
      if (examSet.status !== 'ACTIVE') {
        throw new AppError(400, 'ACTIVE 상태의 시험세트만 배정할 수 있습니다');
      }

      return tx.examinee.update({
        where: { id },
        data: { assignedExamSetId: examSetId },
        select: {
          id: true,
          loginId: true,
          name: true,
          assignedExamSetId: true,
          assignedExamSet: {
            select: {
              id: true,
              name: true,
              examSetNumber: true,
            },
          },
          updatedAt: true,
        },
      });
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
