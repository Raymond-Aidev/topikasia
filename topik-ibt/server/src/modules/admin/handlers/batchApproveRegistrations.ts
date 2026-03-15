import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';
import { approveRegistrationInTx } from './approveRegistration';

const batchSchema = z.object({
  registrationIds: z.array(z.string().min(1)).min(1, '승인할 접수 ID를 하나 이상 입력해주세요'),
});

/**
 * POST /api/admin/registrations/batch-approve
 * 일괄 승인 (어드민)
 * 전체를 단일 트랜잭션으로 처리. 하나라도 실패 시 전체 롤백.
 */
export async function batchApproveRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = batchSchema.parse(req.body);
    const adminId = req.admin!.sub;

    const results = await prisma.$transaction(async (tx) => {
      const approved = [];
      for (const registrationId of body.registrationIds) {
        const result = await approveRegistrationInTx(tx, registrationId, adminId);
        approved.push(result);
      }
      return approved;
    });

    res.json({
      success: true,
      message: `${results.length}건의 접수가 승인되었습니다.`,
      data: {
        approved: results.map((r: any) => ({
          registrationId: r.registrationId,
          examineeId: r.examineeId,
          loginId: r.loginId,
        })),
      },
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
