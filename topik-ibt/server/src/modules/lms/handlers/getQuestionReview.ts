/**
 * GET /api/lms/sessions/:sessionId/review
 * LMS-02~04: 문제 복습 (내 답안 + 정답 + 해설)
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

export async function getQuestionReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) throw new AppError(401, '인증이 필요합니다');

    const sessionId = req.params.sessionId as string;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        examSet: { select: { sectionsJson: true, examType: true, name: true } },
        answers: { orderBy: [{ section: 'asc' }, { questionIndex: 'asc' }] },
        explanations: true,
      },
    });

    if (!session) throw new AppError(404, '세션을 찾을 수 없습니다');
    if (session.examineeId !== req.examinee.sub) throw new AppError(403, '본인의 세션만 조회할 수 있습니다');
    if (session.status !== 'COMPLETED') throw new AppError(400, '완료된 시험만 복습할 수 있습니다');

    // sectionsJson에서 정답 정보 추출
    const sectionsJson = session.examSet.sectionsJson as any;
    const correctAnswerMap = new Map<string, { correctAnswer: any; typeCode: string }>();

    const sections = Array.isArray(sectionsJson) ? sectionsJson : Object.values(sectionsJson);
    for (const sec of sections) {
      const questions = sec.questions || [];
      for (const q of questions) {
        correctAnswerMap.set(q.bankId, {
          correctAnswer: q.correctAnswer ?? null,
          typeCode: q.typeCode,
        });
      }
    }

    // 캐시된 해설 맵
    const explanationMap = new Map(
      session.explanations.map((e: any) => [e.questionBankId, e.explanation]),
    );

    const questions = session.answers.map(a => {
      const questionInfo = correctAnswerMap.get(a.questionBankId);
      return {
        answerId: a.id,
        questionBankId: a.questionBankId,
        section: a.section,
        questionIndex: a.questionIndex,
        examineeAnswer: a.answerJson,
        correctAnswer: questionInfo?.correctAnswer ?? null,
        typeCode: questionInfo?.typeCode ?? null,
        isCorrect: questionInfo?.correctAnswer != null
          ? JSON.stringify(a.answerJson) === JSON.stringify(questionInfo.correctAnswer)
          : null,
        explanation: explanationMap.get(a.questionBankId) || null,
      };
    });

    res.json({
      sessionId: session.id,
      examSetName: session.examSet.name,
      examType: session.examSet.examType,
      questions,
    });
  } catch (err) {
    next(err);
  }
}
