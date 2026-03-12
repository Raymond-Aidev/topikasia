/**
 * GET /api/exam/score
 * 응시자 본인 성적 조회 (공개된 성적만)
 * SCORE-01: 어드민이 공개한 후에만 접근 가능
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

export async function getMyScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const scores = await prisma.score.findMany({
      where: {
        examineeId: req.examinee.sub,
        isPublished: true,
      },
      include: {
        examSet: { select: { name: true, examType: true } },
        session: { select: { startedAt: true, completedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (scores.length === 0) {
      res.json({ data: null, message: '공개된 성적이 없습니다' });
      return;
    }

    // 응시자에게는 questionResults 제외하고 반환
    const result = scores.map(s => {
      const sectionScores = s.sectionScores as Record<string, any>;
      const cleanScores: Record<string, any> = {};
      for (const [section, data] of Object.entries(sectionScores)) {
        cleanScores[section] = {
          raw: data.raw,
          scaled: data.scaled,
          maxScore: data.maxScore,
        };
      }
      return {
        id: s.id,
        examSetName: s.examSet.name,
        examType: s.examSet.examType,
        examDate: s.session.startedAt,
        sectionScores: cleanScores,
        totalScore: s.totalScore,
        maxTotalScore: s.maxTotalScore,
        grade: s.grade,
        publishedAt: s.publishedAt,
      };
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
