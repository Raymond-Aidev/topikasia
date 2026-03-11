import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';
import { generateExamSetNumber } from '../../../shared/utils/examSetNumber';

/**
 * POST /api/question-module/exam-sets
 * 시험세트 생성 (DRAFT 상태)
 *
 * ACID T1-06: examSetNumber를 자동 생성 (PostgreSQL 시퀀스 기반)
 */
export async function createExamSet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError(401, '관리자 인증이 필요합니다');
    }

    const { name, examType, description, sectionsJson, scheduledStartAt } = req.body;

    if (!name || !examType || !sectionsJson) {
      throw new AppError(400, '필수 필드가 누락되었습니다: name, examType, sectionsJson');
    }

    if (!['TOPIK_I', 'TOPIK_II'].includes(examType)) {
      throw new AppError(400, '유효하지 않은 시험 유형입니다. TOPIK_I 또는 TOPIK_II를 사용하세요');
    }

    // ACID T1-06: 시험세트 번호 자동 생성
    const examSetNumber = await generateExamSetNumber();

    const examSet = await prisma.examSet.create({
      data: {
        examSetNumber,
        name,
        examType,
        description: description ?? null,
        status: 'DRAFT',
        sectionsJson,
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: examSet,
    });
  } catch (err) {
    next(err);
  }
}
