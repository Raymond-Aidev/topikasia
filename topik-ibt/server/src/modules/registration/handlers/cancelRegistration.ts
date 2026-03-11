import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * DELETE /api/registration/my/:id
 * 접수 취소 (PENDING 상태인 경우에만)
 * ACID: 트랜잭션 내에서 상태 변경 + currentCount 감소
 */
export async function cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.registrationUser!.sub;
    const id = req.params.id as string;

    await prisma.$transaction(async (tx) => {
      // 1. 접수 확인 (FOR UPDATE)
      const registrations = await tx.$queryRaw`
        SELECT "id", "userId", "scheduleId", "status"
        FROM "Registration"
        WHERE "id" = ${id}
        FOR UPDATE
      ` as any[];

      if (registrations.length === 0) {
        throw new AppError(404, '접수 내역을 찾을 수 없습니다');
      }

      const registration = registrations[0];

      // 소유권 확인
      if (registration.userId !== userId) {
        throw new AppError(403, '접근 권한이 없습니다');
      }

      // PENDING 상태만 취소 가능
      if (registration.status !== 'PENDING') {
        throw new AppError(400, `${registration.status} 상태의 접수는 취소할 수 없습니다`);
      }

      // 2. 상태 변경
      await tx.$executeRaw`
        UPDATE "Registration"
        SET "status" = 'CANCELLED'::"RegistrationStatus", "updatedAt" = NOW()
        WHERE "id" = ${id}
      `;

      // 3. currentCount 감소
      await tx.$executeRaw`
        UPDATE "ExamSchedule"
        SET "currentCount" = GREATEST("currentCount" - 1, 0), "updatedAt" = NOW()
        WHERE "id" = ${registration.scheduleId}
      `;
    });

    res.json({
      success: true,
      message: '접수가 취소되었습니다.',
    });
  } catch (err) {
    next(err);
  }
}
