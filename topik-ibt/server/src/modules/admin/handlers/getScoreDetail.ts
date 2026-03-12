/**
 * GET /api/admin/scores/:id
 * 성적 상세 조회 (수동채점용 답안 포함)
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

export async function getScoreDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const score = await prisma.score.findUnique({
      where: { id },
      include: {
        examinee: { select: { name: true, registrationNumber: true, loginId: true } },
        examSet: { select: { name: true, examType: true, sectionsJson: true } },
        session: {
          include: {
            answers: { orderBy: [{ section: 'asc' }, { questionIndex: 'asc' }] },
          },
        },
      },
    });

    if (!score) {
      throw new AppError(404, '성적을 찾을 수 없습니다');
    }

    const answers = score.session.answers.map((a: any) => ({
      id: a.id,
      questionBankId: a.questionBankId,
      section: a.section,
      questionIndex: a.questionIndex,
      answerJson: a.answerJson,
      submittedAt: a.submittedAt,
      isAutoSubmitted: a.isAutoSubmitted,
    }));

    res.json({
      id: score.id,
      sessionId: score.sessionId,
      examinee: (score as any).examinee,
      examSet: {
        name: (score as any).examSet.name,
        examType: (score as any).examSet.examType,
      },
      sectionScores: score.sectionScores,
      totalScore: score.totalScore,
      maxTotalScore: score.maxTotalScore,
      grade: score.grade,
      gradingStatus: score.gradingStatus,
      isPublished: score.isPublished,
      publishedAt: score.publishedAt,
      gradedAt: score.gradedAt,
      answers,
    });
  } catch (err) {
    next(err);
  }
}
