import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

const rejectSchema = z.object({
  rejectionNote: z.string().min(1, '반려 사유를 입력해주세요'),
});

/**
 * POST /api/admin/registrations/:id/reject
 * 접수 반려 (어드민)
 */
export async function rejectRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const body = rejectSchema.parse(req.body);

    const registrations = await prisma.$queryRaw`
      SELECT "id", "status", "scheduleId"
      FROM "Registration"
      WHERE "id" = ${id}
      LIMIT 1
    ` as any[];

    if (registrations.length === 0) {
      throw new AppError(404, '접수를 찾을 수 없습니다');
    }

    const registration = registrations[0];

    if (registration.status !== 'PENDING') {
      throw new AppError(400, `PENDING 상태의 접수만 반려할 수 있습니다 (현재: ${registration.status})`);
    }

    // 트랜잭션: 상태 변경 + currentCount 감소
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "Registration"
        SET "status" = 'REJECTED'::"RegistrationStatus",
            "rejectionNote" = ${body.rejectionNote},
            "updatedAt" = NOW()
        WHERE "id" = ${id}
      `;

      // 반려 시 정원 차감
      await tx.$executeRaw`
        UPDATE "ExamSchedule"
        SET "currentCount" = GREATEST("currentCount" - 1, 0), "updatedAt" = NOW()
        WHERE "id" = ${registration.scheduleId}
      `;
    });

    res.json({
      success: true,
      message: '접수가 반려되었습니다.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const message = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new AppError(400, `입력값 검증 실패: ${message}`));
    } else {
      next(err);
    }
  }
}
