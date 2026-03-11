import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { ExamSetStatus } from '@prisma/client';

/**
 * GET /api/question-module/exam-sets
 * 시험세트 목록 조회
 *
 * Query params: status, page, count
 */
export async function listExamSets(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = req.query.status as ExamSetStatus | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const count = req.query.count ? Number(req.query.count) : 20;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.examSet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * count,
        take: count,
        select: {
          id: true,
          examSetNumber: true,
          name: true,
          examType: true,
          status: true,
          scheduledStartAt: true,
          uploadedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { assignedExaminees: true },
          },
        },
      }),
      prisma.examSet.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      meta: { total, page, count },
    });
  } catch (err) {
    next(err);
  }
}
