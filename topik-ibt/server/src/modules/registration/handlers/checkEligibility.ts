import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/registration/check-eligibility?scheduleId=xxx
 * 응시 대상자 여부 확인 (registrationAuth 필요)
 *
 * 매칭 기준: RegistrationUser.name = Examinee.name
 *           AND Examinee.assignedExamSetId = ExamSchedule.examSetId
 *           AND Examinee.status = 'ACTIVE'
 */
export async function checkEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.registrationUser!.sub;
    const scheduleId = req.query.scheduleId as string;

    if (!scheduleId) {
      throw new AppError(400, 'scheduleId가 필요합니다');
    }

    // 1. RegistrationUser 이름 조회
    const users = await prisma.$queryRaw`
      SELECT "name" FROM "RegistrationUser" WHERE "id" = ${userId} LIMIT 1
    ` as any[];

    if (users.length === 0) {
      throw new AppError(404, '사용자를 찾을 수 없습니다');
    }

    const userName = users[0].name;

    // 2. ExamSchedule의 examSetId 조회
    const schedules = await prisma.$queryRaw`
      SELECT "examSetId" FROM "ExamSchedule" WHERE "id" = ${scheduleId} LIMIT 1
    ` as any[];

    if (schedules.length === 0) {
      throw new AppError(404, '시험 일정을 찾을 수 없습니다');
    }

    const examSetId = schedules[0].examSetId;

    if (!examSetId) {
      // ExamSchedule에 ExamSet이 연결되지 않은 경우
      res.json({ success: true, data: { eligible: false } });
      return;
    }

    // 3. 매칭되는 Examinee 찾기
    const examinees = await prisma.$queryRaw`
      SELECT "id" FROM "Examinee"
      WHERE "name" = ${userName}
        AND "assignedExamSetId" = ${examSetId}
        AND "status" = 'ACTIVE'::"ExamineeStatus"
      LIMIT 1
    ` as any[];

    const eligible = examinees.length > 0;

    res.json({
      success: true,
      data: {
        eligible,
        examineeId: eligible ? examinees[0].id : undefined,
      },
    });
  } catch (err) {
    next(err);
  }
}
