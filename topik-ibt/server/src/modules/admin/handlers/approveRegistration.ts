import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * 단일 접수 승인 로직 (트랜잭션 내에서 호출)
 * 접수 승인 → Examinee 레코드 자동 생성 (수험번호 = DB 시퀀스 순차 발급)
 */
export async function approveRegistrationInTx(
  tx: any,
  registrationId: string,
  adminId: string,
): Promise<{ registrationId: string; examineeId: string; loginId: string }> {
  // 1. 접수 확인 (ExamSchedule.examSetId 포함)
  const registrations = await tx.$queryRaw`
    SELECT r."id", r."userId", r."status", r."examType", r."englishName",
           r."photoUrl", r."scheduleId",
           u."email", u."name",
           s."examSetId"
    FROM "Registration" r
    JOIN "RegistrationUser" u ON r."userId" = u."id"
    LEFT JOIN "ExamSchedule" s ON r."scheduleId" = s."id"
    WHERE r."id" = ${registrationId}
    FOR UPDATE OF r
  ` as any[];

  if (registrations.length === 0) {
    throw new AppError(404, `접수를 찾을 수 없습니다: ${registrationId}`);
  }

  const registration = registrations[0];

  if (registration.status !== 'PENDING') {
    throw new AppError(400, `PENDING 상태의 접수만 승인할 수 있습니다 (현재: ${registration.status})`);
  }

  // 2. 수험번호 순차 발급 (DB 시퀀스 — 260001부터, 중복 불가)
  const seqResult = await tx.$queryRaw`SELECT nextval('examinee_number_seq')::text AS num` as any[];
  const examineeNumber = seqResult[0].num;

  // loginId = registrationNumber = 순차 수험번호
  const loginId = examineeNumber;
  const registrationNumber = examineeNumber;

  const examinees = await tx.$queryRaw`
    INSERT INTO "Examinee" (
      "id", "loginId", "passwordHash", "name", "registrationNumber",
      "photoUrl", "status", "loginFailCount", "createdById", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text, ${loginId}, 'NO_PASSWORD', ${registration.name},
      ${registrationNumber}, ${registration.photoUrl || null},
      'ACTIVE'::"ExamineeStatus", 0, ${adminId}, NOW(), NOW()
    )
    RETURNING "id"
  ` as any[];

  const examineeId = examinees[0].id;

  // 2-1. ExamSchedule에 연결된 ExamSet이 있으면 Examinee에 배정
  if (registration.examSetId) {
    await tx.$executeRaw`
      UPDATE "Examinee"
      SET "assignedExamSetId" = ${registration.examSetId}, "updatedAt" = NOW()
      WHERE "id" = ${examineeId}
    `;
  }

  // 3. Registration 상태 업데이트
  await tx.$executeRaw`
    UPDATE "Registration"
    SET "status" = 'APPROVED'::"RegistrationStatus",
        "examineeId" = ${examineeId},
        "approvedAt" = NOW(),
        "approvedById" = ${adminId},
        "updatedAt" = NOW()
    WHERE "id" = ${registrationId}
  `;

  return { registrationId, examineeId, loginId };
}

/**
 * POST /api/admin/registrations/:id/approve
 * 접수 승인 (어드민)
 */
export async function approveRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.admin!.sub;

    const result = await prisma.$transaction(async (tx) => {
      return approveRegistrationInTx(tx, id, adminId);
    });

    res.json({
      success: true,
      message: '접수가 승인되었습니다.',
      data: {
        registrationId: result.registrationId,
        examineeId: result.examineeId,
        loginId: result.loginId,
      },
    });
  } catch (err) {
    next(err);
  }
}
