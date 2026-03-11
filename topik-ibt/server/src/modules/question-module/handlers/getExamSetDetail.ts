import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/question-module/exam-sets/:id
 * 시험세트 상세 조회
 */
export async function getExamSetDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    const examSet = await prisma.examSet.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true, loginId: true },
        },
        _count: {
          select: { assignedExaminees: true, examSessions: true },
        },
      },
    });

    if (!examSet) {
      throw new AppError(404, '시험세트를 찾을 수 없습니다');
    }

    res.json({
      success: true,
      data: examSet,
    });
  } catch (err) {
    next(err);
  }
}
