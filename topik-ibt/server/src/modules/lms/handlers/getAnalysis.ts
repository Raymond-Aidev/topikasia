/**
 * GET /api/lms/sessions/:sessionId/analysis
 * LMS-07~08: 유형별 강점/약점 분석
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

interface TypeStats {
  total: number;
  correct: number;
  accuracy: number;
}

export async function getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) throw new AppError(401, '인증이 필요합니다');

    const sessionId = req.params.sessionId as string;

    // 캐시 확인
    const cached = await prisma.lmsAnalysis.findUnique({
      where: { sessionId },
    });
    if (cached) {
      res.json({
        typeBreakdown: cached.typeBreakdown,
        strengths: cached.strengths,
        weaknesses: cached.weaknesses,
        cached: true,
      });
      return;
    }

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        examSet: { select: { sectionsJson: true } },
        answers: true,
      },
    });

    if (!session) throw new AppError(404, '세션을 찾을 수 없습니다');
    if (session.examineeId !== req.examinee.sub) throw new AppError(403, '접근 권한이 없습니다');
    if (session.status !== 'COMPLETED') throw new AppError(400, '완료된 시험만 분석할 수 있습니다');

    // sectionsJson에서 문항 정보 추출
    const sectionsJson = session.examSet.sectionsJson as any;
    const questionMap = new Map<string, { typeCode: string; correctAnswer: any }>();
    const sections = Array.isArray(sectionsJson) ? sectionsJson : Object.values(sectionsJson);
    for (const sec of sections) {
      for (const q of (sec.questions || [])) {
        questionMap.set(q.bankId, {
          typeCode: q.typeCode,
          correctAnswer: q.correctAnswer,
        });
      }
    }

    // 유형별 통계 계산
    const typeBreakdown: Record<string, TypeStats> = {};
    const answerMap = new Map(session.answers.map(a => [a.questionBankId, a]));

    for (const [bankId, qInfo] of questionMap) {
      const type = qInfo.typeCode;
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = { total: 0, correct: 0, accuracy: 0 };
      }
      typeBreakdown[type].total++;

      const answer = answerMap.get(bankId);
      if (qInfo.correctAnswer != null && answer) {
        const isCorrect = JSON.stringify(answer.answerJson) === JSON.stringify(qInfo.correctAnswer);
        if (isCorrect) typeBreakdown[type].correct++;
      }
    }

    // 정답률 계산
    for (const stats of Object.values(typeBreakdown)) {
      stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    }

    // 강점 (70%+) / 약점 (50%-)
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    for (const [type, stats] of Object.entries(typeBreakdown)) {
      if (stats.total >= 2) { // 최소 2문항 이상
        if (stats.accuracy >= 70) strengths.push(type);
        if (stats.accuracy < 50) weaknesses.push(type);
      }
    }

    // 캐시 저장
    await prisma.lmsAnalysis.create({
      data: {
        sessionId,
        examineeId: req.examinee.sub,
        typeBreakdown: typeBreakdown as any,
        strengths: strengths as any,
        weaknesses: weaknesses as any,
      },
    });

    res.json({ typeBreakdown, strengths, weaknesses, cached: false });
  } catch (err) {
    next(err);
  }
}
