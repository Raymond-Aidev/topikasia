import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/admin/examinees/:id/sessions
 * 특정 응시자의 시험 세션 목록 조회
 */
export async function listExamineeSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const examineeId = req.params.id as string;

    const examinee = await prisma.examinee.findUnique({ where: { id: examineeId }, select: { id: true } });
    if (!examinee) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    const sessions = await prisma.examSession.findMany({
      where: { examineeId },
      include: {
        examSet: { select: { name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    const result = sessions.map(s => ({
      id: s.id,
      examSetName: s.examSet.name,
      startedAt: s.startedAt,
      endedAt: s.completedAt,
      status: s.status,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}
