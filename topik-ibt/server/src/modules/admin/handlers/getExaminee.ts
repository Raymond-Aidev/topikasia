import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/admin/examinees/:id
 * 응시자 상세 조회 (시험 세션 포함)
 */
export async function getExaminee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const examinee = await prisma.examinee.findUnique({
      where: { id },
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
        loginFailCount: true,
        assignedExamSetId: true,
        assignedExamSet: {
          select: {
            id: true,
            name: true,
            examSetNumber: true,
            examType: true,
            status: true,
          },
        },
        createdById: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        examSessions: {
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            examSetId: true,
            status: true,
            sectionProgressJson: true,
            startedAt: true,
            completedAt: true,
            examSet: {
              select: {
                id: true,
                name: true,
                examSetNumber: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!examinee) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    res.json({
      success: true,
      data: examinee,
    });
  } catch (err) {
    next(err);
  }
}
