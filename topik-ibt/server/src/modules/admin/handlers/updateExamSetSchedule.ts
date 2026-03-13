import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * PATCH /api/admin/exam-sets/:id/schedule
 * 시험세트 시행 일정 수정
 * - scheduledStartAt: ISO string | null (null = 상시 응시)
 */
export async function updateExamSetSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { scheduledStartAt } = req.body;

    const examSet = await prisma.examSet.findUnique({ where: { id } });

    if (!examSet) {
      throw new AppError(404, '시험세트를 찾을 수 없습니다');
    }

    if (examSet.status !== 'ACTIVE') {
      throw new AppError(400, 'ACTIVE 상태의 시험세트만 일정을 변경할 수 있습니다');
    }

    const updated = await prisma.examSet.update({
      where: { id },
      data: {
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
      },
      select: {
        id: true,
        examSetNumber: true,
        name: true,
        scheduledStartAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
