import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/admin/exam-sessions/:id
 * 시험 세션 상세 조회 (답안 포함)
 */
export async function getExamSessionDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const session = await prisma.examSession.findUnique({
      where: { id },
      select: {
        id: true,
        examineeId: true,
        examSetId: true,
        status: true,
        sectionProgressJson: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        examinee: {
          select: {
            id: true,
            loginId: true,
            name: true,
            registrationNumber: true,
            seatNumber: true,
            institutionName: true,
            examRoomName: true,
          },
        },
        examSet: {
          select: {
            id: true,
            name: true,
            examSetNumber: true,
            examType: true,
          },
        },
        answers: {
          orderBy: [{ section: 'asc' }, { questionIndex: 'asc' }],
          select: {
            id: true,
            questionBankId: true,
            section: true,
            questionIndex: true,
            answerJson: true,
            savedAt: true,
            submittedAt: true,
            isAutoSubmitted: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, '시험 세션을 찾을 수 없습니다');
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}
