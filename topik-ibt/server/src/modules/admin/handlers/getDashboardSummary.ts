import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';

/**
 * GET /api/admin/dashboard/summary
 * 대시보드 요약 정보
 */
export async function getDashboardSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalExaminees,
      activeExaminees,
      inactiveExaminees,
      lockedExaminees,
      completedSessions,
      inProgressSessions,
      examSets,
    ] = await prisma.$transaction([
      prisma.examinee.count(),
      prisma.examinee.count({ where: { status: 'ACTIVE' } }),
      prisma.examinee.count({ where: { status: 'INACTIVE' } }),
      prisma.examinee.count({ where: { status: 'LOCKED' } }),
      prisma.examSession.count({ where: { status: 'COMPLETED' } }),
      prisma.examSession.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.examSet.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          examSetNumber: true,
          _count: {
            select: {
              assignedExaminees: true,
              examSessions: true,
            },
          },
        },
      }),
    ]);

    // 시험세트별 세션 상태 통계
    const examSetStats = await Promise.all(
      examSets.map(async (es) => {
        const [completed, inProgress, notStarted] = await prisma.$transaction([
          prisma.examSession.count({
            where: { examSetId: es.id, status: 'COMPLETED' },
          }),
          prisma.examSession.count({
            where: { examSetId: es.id, status: 'IN_PROGRESS' },
          }),
          prisma.examinee.count({
            where: {
              assignedExamSetId: es.id,
              examSessions: { none: { examSetId: es.id } },
            },
          }),
        ]);

        return {
          id: es.id,
          name: es.name,
          examSetNumber: es.examSetNumber,
          assignedCount: es._count.assignedExaminees,
          sessionCount: es._count.examSessions,
          completed,
          inProgress,
          notStarted,
        };
      }),
    );

    // 전체 미시작 응시자 수 계산
    const examineesWithSessions = await prisma.examinee.count({
      where: { examSessions: { some: {} } },
    });
    const notStartedTotal = totalExaminees - examineesWithSessions;

    res.json({
      success: true,
      data: {
        examinees: {
          total: totalExaminees,
          active: activeExaminees,
          inactive: inactiveExaminees,
          locked: lockedExaminees,
        },
        sessions: {
          completed: completedSessions,
          inProgress: inProgressSessions,
          notStarted: notStartedTotal,
        },
        examSetStats,
      },
    });
  } catch (err) {
    next(err);
  }
}
