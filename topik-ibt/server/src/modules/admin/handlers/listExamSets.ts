import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';

/**
 * GET /api/admin/exam-sets
 * 시험세트 목록 조회 (배정된 응시자 수 포함)
 */
export async function listExamSets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const examSets = await prisma.examSet.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        examSetNumber: true,
        name: true,
        examType: true,
        description: true,
        status: true,
        scheduledStartAt: true,
        uploadedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { assignedExaminees: true },
        },
      },
    });

    res.json({
      success: true,
      data: examSets.map((es: any) => ({
        ...es,
        assignedCount: es._count.assignedExaminees,
        _count: undefined,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/exam-sets/assignable
 * 배정 가능한 시험세트 목록 (ACTIVE만)
 * ACID T3-05
 */
export async function listAssignableExamSets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const examSets = await prisma.examSet.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        examSetNumber: true,
        name: true,
        examType: true,
        description: true,
        status: true,
        _count: {
          select: { assignedExaminees: true },
        },
      },
    });

    res.json({
      success: true,
      data: examSets.map((es: any) => ({
        ...es,
        assignedCount: es._count.assignedExaminees,
        _count: undefined,
      })),
    });
  } catch (err) {
    next(err);
  }
}
