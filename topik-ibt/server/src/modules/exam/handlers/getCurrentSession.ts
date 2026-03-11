import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/exam/session/current
 * TASK-10 Section 8: 현재 세션 조회
 */
export async function getCurrentSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const session = await prisma.examSession.findFirst({
      where: {
        examineeId: req.examinee.sub,
        status: 'IN_PROGRESS',
      },
      include: {
        answers: true,
        examSet: {
          select: {
            id: true,
            examSetNumber: true,
            name: true,
            examType: true,
            sectionsJson: true,
            scheduledStartAt: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, '진행중인 시험 세션이 없습니다');
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}
