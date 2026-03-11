import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';
import { ExamineeStatus } from '@prisma/client';

/**
 * PUT /api/admin/examinees/:id/status
 * 응시자 상태 변경
 */
export async function changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !Object.values(ExamineeStatus).includes(status)) {
      throw new AppError(400, '유효하지 않은 상태값입니다 (ACTIVE, INACTIVE, LOCKED)');
    }

    const examinee = await prisma.examinee.findUnique({ where: { id } });
    if (!examinee) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    const updated = await prisma.examinee.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        loginId: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
