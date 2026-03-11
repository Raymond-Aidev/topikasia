import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * PUT /api/question-module/exam-sets/:id
 * 시험세트 수정 (DRAFT 상태에서만 가능)
 */
export async function updateExamSet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError(401, '관리자 인증이 필요합니다');
    }

    const id = req.params.id as string;
    const { name, description, sectionsJson, scheduledStartAt } = req.body;

    // 현재 시험세트 조회
    const existing = await prisma.examSet.findUnique({ where: { id: id as string } });

    if (!existing) {
      throw new AppError(404, '시험세트를 찾을 수 없습니다');
    }

    // DRAFT 상태에서만 수정 가능
    if (existing.status !== 'DRAFT') {
      throw new AppError(
        409,
        `현재 상태(${existing.status})에서는 수정할 수 없습니다. DRAFT 상태에서만 수정이 가능합니다`,
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sectionsJson !== undefined) updateData.sectionsJson = sectionsJson;
    if (scheduledStartAt !== undefined) {
      updateData.scheduledStartAt = scheduledStartAt ? new Date(scheduledStartAt) : null;
    }

    const updated = await prisma.examSet.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
