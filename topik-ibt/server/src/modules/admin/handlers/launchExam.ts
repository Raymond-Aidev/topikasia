import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * POST /api/admin/exam-sets/:id/launch
 * 시험 발행: ExamSchedule 생성 + 선택된 회원(RegistrationUser)에 대해 Examinee + Registration 자동 생성
 */
export async function launchExam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const examSetId = req.params.id as string;
    const adminId = req.admin!.sub;
    const { startAt, endAt, timeLimitMinutes, memberIds } = req.body;

    if (!startAt || !endAt || !timeLimitMinutes || !memberIds?.length) {
      throw new AppError(400, '시작일시, 종료일시, 시험시간, 응시자를 모두 입력해주세요');
    }

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      throw new AppError(400, '응시자를 1명 이상 선택해주세요');
    }

    // ExamSet 확인
    const examSet = await prisma.examSet.findUnique({
      where: { id: examSetId },
      select: { id: true, name: true, examType: true, status: true },
    });

    if (!examSet) {
      throw new AppError(404, '시험세트를 찾을 수 없습니다');
    }

    if (examSet.status !== 'ACTIVE') {
      throw new AppError(400, 'ACTIVE 상태의 시험세트만 발행할 수 있습니다');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. ExamSchedule 생성
      const schedules = await tx.$queryRaw`
        INSERT INTO "ExamSchedule" (
          "id", "examName", "examRound", "examType", "examDate",
          "registrationStartAt", "registrationEndAt", "venues",
          "maxCapacity", "currentCount", "status", "examSetId",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, ${examSet.name}, 1, ${examSet.examType}::"ExamType",
          ${new Date(startAt)}, ${new Date()}, ${new Date(endAt)},
          '[]'::jsonb, ${memberIds.length}, ${memberIds.length},
          'OPEN'::"ScheduleStatus", ${examSetId},
          NOW(), NOW()
        )
        RETURNING "id"
      ` as any[];

      const scheduleId = schedules[0].id;

      // 2. 회원들에 대해 Examinee + Registration 생성
      const examinees: Array<{ name: string; email: string; loginId: string }> = [];

      for (const memberId of memberIds) {
        // RegistrationUser 조회
        const members = await tx.$queryRaw`
          SELECT "id", "name", "email" FROM "RegistrationUser" WHERE "id" = ${memberId}
        ` as any[];

        if (members.length === 0) {
          throw new AppError(404, `회원을 찾을 수 없습니다: ${memberId}`);
        }

        const member = members[0];

        // 중복 Registration 확인
        const existing = await tx.$queryRaw`
          SELECT "id" FROM "Registration"
          WHERE "userId" = ${memberId} AND "scheduleId" = ${scheduleId}
          LIMIT 1
        ` as any[];

        if (existing.length > 0) continue;

        // 수험번호 순차 발급
        const seqResult = await tx.$queryRaw`SELECT nextval('examinee_number_seq')::text AS num` as any[];
        const loginId = seqResult[0].num;

        // Examinee 생성
        const newExaminees = await tx.$queryRaw`
          INSERT INTO "Examinee" (
            "id", "loginId", "passwordHash", "name", "registrationNumber",
            "status", "loginFailCount", "assignedExamSetId", "createdById",
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, ${loginId}, 'NO_PASSWORD', ${member.name},
            ${loginId}, 'ACTIVE'::"ExamineeStatus", 0, ${examSetId}, ${adminId},
            NOW(), NOW()
          )
          RETURNING "id"
        ` as any[];

        const examineeId = newExaminees[0].id;

        // Registration 생성 (APPROVED)
        await tx.$executeRaw`
          INSERT INTO "Registration" (
            "id", "userId", "scheduleId", "examType", "englishName",
            "birthDate", "gender", "venueId", "venueName",
            "status", "examineeId", "approvedAt", "approvedById",
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, ${memberId}, ${scheduleId}, ${examSet.examType}::"ExamType",
            ${member.name}, '2000-01-01'::date, 'MALE'::"Gender",
            'ADMIN', '관리자 발행',
            'APPROVED'::"RegistrationStatus", ${examineeId}, NOW(), ${adminId},
            NOW(), NOW()
          )
        `;

        examinees.push({ name: member.name, email: member.email, loginId });
      }

      // 3. ExamSet.scheduledStartAt 업데이트
      await tx.$executeRaw`
        UPDATE "ExamSet"
        SET "scheduledStartAt" = ${new Date(startAt)}, "updatedAt" = NOW()
        WHERE "id" = ${examSetId}
      `;

      return { scheduleId, examinees };
    });

    res.json({
      success: true,
      message: `시험이 발행되었습니다. ${result.examinees.length}명의 응시자가 등록되었습니다.`,
      data: {
        scheduleId: result.scheduleId,
        examinees: result.examinees,
      },
    });
  } catch (err) {
    next(err);
  }
}
