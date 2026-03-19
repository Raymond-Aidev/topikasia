import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/exam/assigned-set
 * TASK-10 Section 2: 배정된 시험세트 조회
 */
export async function getAssignedSet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const examinee = await prisma.examinee.findUnique({
      where: { id: req.examinee.sub },
      include: {
        assignedExamSet: true,
      },
    });

    if (!examinee) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    if (!examinee.assignedExamSet) {
      throw new AppError(404, '배정된 시험세트가 없습니다');
    }

    const examSet = examinee.assignedExamSet;

    // ACTIVE 상태가 아닌 시험세트는 조회 불가
    if (examSet.status !== 'ACTIVE') {
      throw new AppError(403, '아직 시험을 시작할 수 없습니다. 시험세트가 활성화되지 않았습니다');
    }

    // sectionsJson → sections 배열 변환 (클라이언트 AssignedExamSet 인터페이스 호환)
    const sectionsJson = examSet.sectionsJson as Record<string, any> || {};
    const sections = Object.entries(sectionsJson).map(([key, val]) => ({
      section: val.section || key,
      questionCount: val.questionCount || (val.questions?.length ?? 0),
      durationMinutes: val.durationMinutes || 0,
    }));
    const totalDurationMinutes = sections.reduce((sum, s) => sum + s.durationMinutes, 0);

    res.json({
      success: true,
      data: {
        examSetId: examSet.id,
        examSetNumber: examSet.examSetNumber,
        name: examSet.name,
        examType: examSet.examType,
        description: examSet.description,
        sections,
        totalDurationMinutes,
        scheduledStartAt: examSet.scheduledStartAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
