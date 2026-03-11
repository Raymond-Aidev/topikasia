import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { SessionStatus, Prisma } from '@prisma/client';

/**
 * GET /api/admin/exam-sessions
 * 시험 세션 목록 조회 - 페이지네이션, 필터링
 */
export async function listExamSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const status = req.query.status as SessionStatus | undefined;
    const examSetId = req.query.examSetId as string | undefined;
    const examineeId = req.query.examineeId as string | undefined;
    const search = (req.query.search as string) || '';

    const where: Prisma.ExamSessionWhereInput = {};

    if (status && Object.values(SessionStatus).includes(status)) {
      where.status = status;
    }
    if (examSetId) {
      where.examSetId = examSetId;
    }
    if (examineeId) {
      where.examineeId = examineeId;
    }
    if (search) {
      where.examinee = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { loginId: { contains: search, mode: 'insensitive' } },
          { registrationNumber: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, sessions] = await prisma.$transaction([
      prisma.examSession.count({ where }),
      prisma.examSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          examineeId: true,
          examSetId: true,
          status: true,
          sectionProgressJson: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          examinee: {
            select: {
              id: true,
              loginId: true,
              name: true,
              registrationNumber: true,
              seatNumber: true,
              institutionName: true,
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
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
