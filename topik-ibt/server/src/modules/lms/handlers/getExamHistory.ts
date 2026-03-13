/**
 * GET /api/lms/history
 * LMS-01: 시험 이력 목록 (완료된 세션 + 성적)
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

export async function getExamHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      // registrationToken으로 인증했지만 연결된 Examinee가 없는 경우
      res.json({ data: [] });
      return;
    }

    const sessions = await prisma.examSession.findMany({
      where: {
        examineeId: req.examinee.sub,
        status: 'COMPLETED',
      },
      include: {
        examSet: { select: { name: true, examType: true, examSetNumber: true } },
        score: {
          select: {
            totalScore: true,
            maxTotalScore: true,
            grade: true,
            sectionScores: true,
            isPublished: true,
            gradingStatus: true,
          },
        },
        answers: { select: { id: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    const history = sessions.map(s => ({
      sessionId: s.id,
      examSetName: s.examSet.name,
      examType: s.examSet.examType,
      examSetNumber: s.examSet.examSetNumber,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      answerCount: s.answers.length,
      score: s.score ? {
        totalScore: s.score.totalScore,
        maxTotalScore: s.score.maxTotalScore,
        grade: s.score.grade,
        sectionScores: s.score.sectionScores,
        isPublished: s.score.isPublished,
        gradingStatus: s.score.gradingStatus,
      } : null,
    }));

    res.json({ data: history });
  } catch (err) {
    next(err);
  }
}
