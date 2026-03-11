import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/admin/exam-sets/:id
 * 시험세트 상세 조회 (섹션 정보 + 배정된 응시자 수)
 */
export async function getExamSet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const examSet = await prisma.examSet.findUnique({
      where: { id },
      select: {
        id: true,
        examSetNumber: true,
        name: true,
        examType: true,
        description: true,
        status: true,
        sectionsJson: true,
        scheduledStartAt: true,
        uploadedAt: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedExaminees: true,
            examSessions: true,
          },
        },
      },
    });

    if (!examSet) {
      throw new AppError(404, '시험세트를 찾을 수 없습니다');
    }

    res.json({
      success: true,
      data: {
        ...examSet,
        assignedExamineesCount: examSet._count.assignedExaminees,
        examSessionsCount: examSet._count.examSessions,
        _count: undefined,
      },
    });
  } catch (err) {
    next(err);
  }
}
