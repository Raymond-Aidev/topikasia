import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/registration/schedules
 * 시험 일정 목록 조회 (Public)
 * Query params: examType (optional), status (optional)
 *
 * GET /api/registration/schedules/:id
 * 시험 일정 상세 조회 (Public)
 */
export async function listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { examType, status } = req.query;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (examType && (examType === 'TOPIK_I' || examType === 'TOPIK_II')) {
      conditions.push(`"examType" = $${paramIndex}::"ExamType"`);
      params.push(examType);
      paramIndex++;
    }

    if (status && ['OPEN', 'CLOSED', 'FULL'].includes(status as string)) {
      conditions.push(`"status" = $${paramIndex}::"ScheduleStatus"`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const schedules = await prisma.$queryRawUnsafe(
      `SELECT "id", "examName", "examRound", "examType", "examDate",
              "registrationStartAt", "registrationEndAt", "venues",
              "maxCapacity", "currentCount", "status", "createdAt"
       FROM "ExamSchedule"
       WHERE ${whereClause}
       ORDER BY "examDate" ASC`,
      ...params,
    ) as any[];

    res.json({
      success: true,
      data: { schedules },
    });
  } catch (err) {
    next(err);
  }
}

export async function getScheduleDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const schedules = await prisma.$queryRaw`
      SELECT "id", "examName", "examRound", "examType", "examDate",
             "registrationStartAt", "registrationEndAt", "venues",
             "maxCapacity", "currentCount", "status", "createdAt"
      FROM "ExamSchedule"
      WHERE "id" = ${id}
      LIMIT 1
    ` as any[];

    if (schedules.length === 0) {
      throw new AppError(404, '시험 일정을 찾을 수 없습니다');
    }

    res.json({
      success: true,
      data: schedules[0],
    });
  } catch (err) {
    next(err);
  }
}
