/**
 * PATCH /api/admin/scores/:id/manual-grade
 * 수동채점 (쓰기 영역 점수 입력)
 * body: { sectionScores: { WRITING: { raw: number } } }
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { calculateGrade } from '../../../services/scoring.service';
import { AppError } from '../../../shared/types';

export async function manualGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { sectionScores: inputScores } = req.body as {
      sectionScores: Record<string, { raw: number }>;
    };

    if (!inputScores || Object.keys(inputScores).length === 0) {
      throw new AppError(400, '점수를 입력해주세요');
    }

    const score = await prisma.score.findUnique({ where: { id } });
    if (!score) {
      throw new AppError(404, '성적을 찾을 수 없습니다');
    }

    const adminId = (req as any).admin?.sub as string;

    // 기존 sectionScores에 수동 입력 점수 병합
    const currentScores = score.sectionScores as Record<string, any>;
    let newTotalScore = 0;

    for (const [section, sectionData] of Object.entries(currentScores)) {
      if (inputScores[section]) {
        const raw = inputScores[section].raw;
        if (raw < 0 || raw > (sectionData.maxScore || 100)) {
          throw new AppError(400, `${section} 점수가 범위를 벗어납니다 (0~${sectionData.maxScore || 100})`);
        }
        currentScores[section] = {
          ...sectionData,
          raw,
          scaled: raw,
          autoGraded: false,
        };
      }
      newTotalScore += currentScores[section].raw;
    }

    const grade = calculateGrade(score.examType, newTotalScore);

    const updated = await prisma.score.update({
      where: { id },
      data: {
        sectionScores: currentScores,
        totalScore: newTotalScore,
        grade,
        gradingStatus: 'FULLY_GRADED',
        gradedAt: new Date(),
        gradedById: adminId,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_GRADE',
        targetType: 'Score',
        targetId: id,
        detail: { inputScores, newTotalScore, grade, adminId },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
