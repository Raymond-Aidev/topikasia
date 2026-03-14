import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';

/**
 * GET /api/admin/dashboard/summary
 * 대시보드 요약 정보 (단일 쿼리 최적화)
 */
export async function getDashboardSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. 응시자 상태별 카운트 (1 쿼리)
    const examineeCounts = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "total",
        COUNT(*) FILTER (WHERE "status" = 'ACTIVE')::int AS "active",
        COUNT(*) FILTER (WHERE "status" = 'INACTIVE')::int AS "inactive",
        COUNT(*) FILTER (WHERE "status" = 'LOCKED')::int AS "locked",
        COUNT(*) FILTER (WHERE "id" NOT IN (SELECT DISTINCT "examineeId" FROM "ExamSession"))::int AS "notStarted"
      FROM "Examinee"
    ` as any[];

    // 2. 세션 상태별 카운트 (1 쿼리)
    const sessionCounts = await prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS "completed",
        COUNT(*) FILTER (WHERE "status" = 'IN_PROGRESS')::int AS "inProgress"
      FROM "ExamSession"
    ` as any[];

    // 3. 시험세트별 통계 (1 쿼리)
    const examSetStats = await prisma.$queryRaw`
      SELECT
        es."id",
        es."name",
        es."examSetNumber",
        COUNT(DISTINCT e."id")::int AS "assignedCount",
        COUNT(DISTINCT sess."id") FILTER (WHERE sess."status" = 'COMPLETED')::int AS "completed",
        COUNT(DISTINCT sess."id") FILTER (WHERE sess."status" = 'IN_PROGRESS')::int AS "inProgress",
        (COUNT(DISTINCT e."id") - COUNT(DISTINCT sess."examineeId"))::int AS "notStarted"
      FROM "ExamSet" es
      LEFT JOIN "Examinee" e ON e."assignedExamSetId" = es."id"
      LEFT JOIN "ExamSession" sess ON sess."examSetId" = es."id" AND sess."examineeId" = e."id"
      WHERE es."status" = 'ACTIVE'
      GROUP BY es."id", es."name", es."examSetNumber"
      ORDER BY es."name"
    ` as any[];

    const ec = examineeCounts[0];
    const sc = sessionCounts[0];

    res.json({
      success: true,
      data: {
        examinees: {
          total: ec.total,
          active: ec.active,
          inactive: ec.inactive,
          locked: ec.locked,
        },
        sessions: {
          completed: sc.completed,
          inProgress: sc.inProgress,
          notStarted: ec.notStarted,
        },
        examSetStats: examSetStats.map((s: any) => ({
          id: s.id,
          name: s.name,
          examSetNumber: s.examSetNumber,
          assignedCount: s.assignedCount,
          completed: s.completed,
          inProgress: s.inProgress,
          notStarted: Math.max(0, s.notStarted),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}
