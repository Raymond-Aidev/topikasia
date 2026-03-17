import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/registration/check-eligibility?scheduleId=xxx
 * 응시 자격 확인 (registrationAuth 필요)
 *
 * 공개 접수(Flow A): 로그인한 회원이면 eligible=true (PENDING으로 접수, 관리자 승인 대기)
 * 관리자 발행(Flow B): Examinee 매칭 시 examineeId도 함께 반환
 */
export async function checkEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.registrationUser!.sub;
    const scheduleId = req.query.scheduleId as string;

    if (!scheduleId) {
      throw new AppError(400, 'scheduleId가 필요합니다');
    }

    // 1. 일정 존재 확인
    const schedules = await prisma.$queryRaw`
      SELECT "examSetId" FROM "ExamSchedule" WHERE "id" = ${scheduleId} LIMIT 1
    ` as any[];

    if (schedules.length === 0) {
      throw new AppError(404, '시험 일정을 찾을 수 없습니다');
    }

    // 2. Examinee 매칭 시도 (있으면 자동 승인용)
    let examineeId: string | undefined;
    const examSetId = schedules[0].examSetId;

    if (examSetId) {
      const users = await prisma.$queryRaw`
        SELECT "name" FROM "RegistrationUser" WHERE "id" = ${userId} LIMIT 1
      ` as any[];

      if (users.length > 0) {
        const examinees = await prisma.$queryRaw`
          SELECT "id" FROM "Examinee"
          WHERE "name" = ${users[0].name}
            AND "assignedExamSetId" = ${examSetId}
            AND "status" = 'ACTIVE'::"ExamineeStatus"
          LIMIT 1
        ` as any[];

        if (examinees.length > 0) {
          examineeId = examinees[0].id;
        }
      }
    }

    // 공개 접수: 로그인된 회원이면 항상 eligible (PENDING으로 접수 가능)
    res.json({
      success: true,
      data: {
        eligible: true,
        examineeId,
      },
    });
  } catch (err) {
    next(err);
  }
}
