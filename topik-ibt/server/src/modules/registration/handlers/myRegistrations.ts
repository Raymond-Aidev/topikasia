import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/registration/my
 * 내 접수 내역 목록
 */
export async function myRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.registrationUser!.sub;

    const registrations = await prisma.$queryRaw`
      SELECT r."id", r."scheduleId", r."examType", r."englishName", r."birthDate",
             r."gender", r."photoUrl", r."venueId", r."venueName",
             r."contactPhone", r."address", r."status", r."examineeId",
             r."rejectionNote", r."approvedAt", r."createdAt",
             s."examName", s."examRound", s."examDate"
      FROM "Registration" r
      JOIN "ExamSchedule" s ON r."scheduleId" = s."id"
      WHERE r."userId" = ${userId}
      ORDER BY r."createdAt" DESC
    ` as any[];

    res.json({
      success: true,
      data: { registrations },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/registration/my/:id
 * 접수 상세 조회
 */
export async function myRegistrationDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.registrationUser!.sub;
    const id = req.params.id as string;

    const registrations = await prisma.$queryRaw`
      SELECT r."id", r."userId", r."scheduleId", r."examType", r."englishName",
             r."birthDate", r."gender", r."photoUrl", r."venueId", r."venueName",
             r."contactPhone", r."address", r."status", r."examineeId",
             r."rejectionNote", r."approvedAt", r."approvedById", r."createdAt",
             s."examName", s."examRound", s."examDate", s."venues"
      FROM "Registration" r
      JOIN "ExamSchedule" s ON r."scheduleId" = s."id"
      WHERE r."id" = ${id}
      LIMIT 1
    ` as any[];

    if (registrations.length === 0) {
      throw new AppError(404, '접수 내역을 찾을 수 없습니다');
    }

    const registration = registrations[0];

    // 소유권 확인
    if (registration.userId !== userId) {
      throw new AppError(403, '접근 권한이 없습니다');
    }

    res.json({
      success: true,
      data: registration,
    });
  } catch (err) {
    next(err);
  }
}
