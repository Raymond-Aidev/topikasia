import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';
import { ExamineeStatus } from '@prisma/client';

/**
 * PUT /api/admin/examinees/:id
 * 응시자 정보 수정 (name, seatNumber, institutionName, examRoomName, status)
 */
export async function updateExaminee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { name, seatNumber, institutionName, examRoomName, status } = req.body;

    const existing = await prisma.examinee.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    if (status && !Object.values(ExamineeStatus).includes(status)) {
      throw new AppError(400, '유효하지 않은 상태값입니다');
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (seatNumber !== undefined) updateData.seatNumber = seatNumber !== null ? Number(seatNumber) : null;
    if (institutionName !== undefined) updateData.institutionName = institutionName;
    if (examRoomName !== undefined) updateData.examRoomName = examRoomName;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.examinee.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        loginId: true,
        name: true,
        registrationNumber: true,
        seatNumber: true,
        photoUrl: true,
        institutionName: true,
        examRoomName: true,
        status: true,
        assignedExamSetId: true,
        createdAt: true,
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
