import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

const SALT_ROUNDS = 12;

/**
 * 수험번호 생성: REG + 타임스탬프(6자리) + 랜덤(4자리)
 */
function generateRegistrationNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `REG${timestamp}${random}`;
}

/**
 * 로그인 ID 생성: 이메일 앞부분 + 랜덤 4자리
 */
function generateLoginId(email: string): string {
  const prefix = email.split('@')[0].slice(0, 10).replace(/[^a-zA-Z0-9]/g, '');
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}${random}`;
}

/**
 * 임시 비밀번호 생성: 8자리 영숫자
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * 단일 접수 승인 로직 (트랜잭션 내에서 호출)
 * 접수 승인 → Examinee 레코드 자동 생성
 */
export async function approveRegistrationInTx(
  tx: any,
  registrationId: string,
  adminId: string,
): Promise<{ registrationId: string; examineeId: string; loginId: string; tempPassword: string }> {
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
    FOR UPDATE
  ` as any[];

  if (registrations.length === 0) {
    throw new AppError(404, `접수를 찾을 수 없습니다: ${registrationId}`);
  }

  const registration = registrations[0];

  if (registration.status !== 'PENDING') {
    throw new AppError(400, `PENDING 상태의 접수만 승인할 수 있습니다 (현재: ${registration.status})`);
  }

  // 2. Examinee 생성
  const loginId = generateLoginId(registration.email);
  const registrationNumber = generateRegistrationNumber();
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  const examinees = await tx.$queryRaw`
    INSERT INTO "Examinee" (
      "id", "loginId", "passwordHash", "name", "registrationNumber",
      "photoUrl", "status", "createdById", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text, ${loginId}, ${passwordHash}, ${registration.name},
      ${registrationNumber}, ${registration.photoUrl || null},
      'ACTIVE'::"ExamineeStatus", ${adminId}, NOW(), NOW()
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

  return { registrationId, examineeId, loginId, tempPassword };
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
        tempPassword: result.tempPassword,
      },
    });
  } catch (err) {
    next(err);
  }
}
