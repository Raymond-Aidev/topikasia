import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * DELETE /api/admin/registrations/:id
 * 접수 삭제 (어드민)
 * - PENDING/REJECTED/CANCELLED: Registration 레코드 삭제 + currentCount 감소 (PENDING만)
 * - APPROVED: Examinee에 ExamSession이 없으면 Examinee + Registration 삭제, 있으면 거부
 */
export async function deleteRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    await prisma.$transaction(async (tx) => {
      // 1. 접수 확인 (FOR UPDATE)
      const registrations = await tx.$queryRaw`
        SELECT "id", "status", "scheduleId", "examineeId"
        FROM "Registration"
        WHERE "id" = ${id}
        FOR UPDATE
      ` as any[];

      if (registrations.length === 0) {
        throw new AppError(404, '접수를 찾을 수 없습니다');
      }

      const reg = registrations[0];

      // 2. APPROVED 상태: Examinee 시험 이력 확인
      if (reg.status === 'APPROVED' && reg.examineeId) {
        const sessions = await tx.$queryRaw`
          SELECT COUNT(*)::int AS count FROM "ExamSession" WHERE "examineeId" = ${reg.examineeId}
        ` as any[];

        if (sessions[0].count > 0) {
          throw new AppError(400, '시험 이력이 있어 삭제할 수 없습니다. 반려 처리를 이용하세요.');
        }

        // Examinee 삭제 (시험 이력 없음)
        await tx.$executeRaw`DELETE FROM "Examinee" WHERE "id" = ${reg.examineeId}`;
      }

      // 3. PENDING 또는 APPROVED 상태면 currentCount 감소
      if (reg.status === 'PENDING' || reg.status === 'APPROVED') {
        await tx.$executeRaw`
          UPDATE "ExamSchedule"
          SET "currentCount" = GREATEST("currentCount" - 1, 0), "updatedAt" = NOW()
          WHERE "id" = ${reg.scheduleId}
        `;
      }

      // 4. Registration 삭제
      await tx.$executeRaw`DELETE FROM "Registration" WHERE "id" = ${id}`;
    });

    res.json({
      success: true,
      message: '접수가 삭제되었습니다.',
    });
  } catch (err) {
    next(err);
  }
}
