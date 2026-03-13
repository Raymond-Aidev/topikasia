/**
 * 어드민 시험 일정(ExamSchedule) CRUD
 * ExamSchedule은 수동 마이그레이션(004)으로 생성된 테이블이므로 raw SQL 사용
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/admin/schedules
 * 시험 일정 전체 목록 조회
 */
export async function listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schedules = await prisma.$queryRaw`
      SELECT "id", "examName", "examRound", "examType", "examDate",
             "registrationStartAt", "registrationEndAt", "venues",
             "maxCapacity", "currentCount", "status", "createdAt", "updatedAt"
      FROM "ExamSchedule"
      ORDER BY "examDate" DESC
    ` as any[];

    res.json({ success: true, data: { schedules } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/schedules
 * 시험 일정 생성
 */
export async function createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      examName, examRound, examType, examDate,
      registrationStartAt, registrationEndAt,
      venues, maxCapacity, status,
    } = req.body;

    if (!examName || !examType || !examDate) {
      throw new AppError(400, 'examName, examType, examDate는 필수입니다');
    }

    const validTypes = ['TOPIK_I', 'TOPIK_II'];
    if (!validTypes.includes(examType)) {
      throw new AppError(400, `examType은 ${validTypes.join(', ')} 중 하나여야 합니다`);
    }

    const venuesJson = JSON.stringify(venues || []);

    const result = await prisma.$queryRaw`
      INSERT INTO "ExamSchedule" (
        id, "examName", "examRound", "examType", "examDate",
        "registrationStartAt", "registrationEndAt",
        venues, "maxCapacity", "currentCount", status,
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${examName},
        ${examRound || 0},
        ${examType}::"ExamType",
        ${new Date(examDate)}::timestamp,
        ${registrationStartAt ? new Date(registrationStartAt) : new Date()}::timestamp,
        ${registrationEndAt ? new Date(registrationEndAt) : new Date('2099-12-31')}::timestamp,
        ${venuesJson}::jsonb,
        ${maxCapacity || 9999},
        0,
        ${status || 'OPEN'}::"ScheduleStatus",
        NOW(), NOW()
      )
      RETURNING *
    ` as any[];

    res.status(201).json({ success: true, data: result[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/schedules/:id
 * 시험 일정 수정
 */
export async function updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const {
      examName, examRound, examDate,
      registrationStartAt, registrationEndAt,
      venues, maxCapacity, status,
    } = req.body;

    // 존재 확인
    const existing = await prisma.$queryRaw`
      SELECT id FROM "ExamSchedule" WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existing.length === 0) {
      throw new AppError(404, '시험 일정을 찾을 수 없습니다');
    }

    const venuesJson = venues ? JSON.stringify(venues) : null;

    const result = await prisma.$queryRaw`
      UPDATE "ExamSchedule"
      SET
        "examName" = COALESCE(${examName}, "examName"),
        "examRound" = COALESCE(${examRound ?? null}::int, "examRound"),
        "examDate" = COALESCE(${examDate ? new Date(examDate) : null}::timestamp, "examDate"),
        "registrationStartAt" = COALESCE(${registrationStartAt ? new Date(registrationStartAt) : null}::timestamp, "registrationStartAt"),
        "registrationEndAt" = COALESCE(${registrationEndAt ? new Date(registrationEndAt) : null}::timestamp, "registrationEndAt"),
        "venues" = COALESCE(${venuesJson}::jsonb, venues),
        "maxCapacity" = COALESCE(${maxCapacity ?? null}::int, "maxCapacity"),
        "status" = COALESCE(${status ?? null}::"ScheduleStatus", status),
        "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    ` as any[];

    res.json({ success: true, data: result[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/schedules/:id
 * 시험 일정 삭제 (접수자가 없는 경우만)
 */
export async function deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    // 접수자 확인
    const registrations = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "Registration" WHERE "scheduleId" = ${id}
    ` as any[];

    if (registrations[0]?.count > 0) {
      throw new AppError(400, `접수자가 ${registrations[0].count}명 있어 삭제할 수 없습니다. 상태를 CLOSED로 변경하세요.`);
    }

    await prisma.$queryRaw`DELETE FROM "ExamSchedule" WHERE id = ${id}`;

    res.json({ success: true, message: '시험 일정이 삭제되었습니다' });
  } catch (err) {
    next(err);
  }
}
