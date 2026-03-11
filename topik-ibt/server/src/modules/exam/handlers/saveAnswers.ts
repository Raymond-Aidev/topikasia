import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

interface AnswerItem {
  questionBankId: string;
  section: string;
  questionIndex: number;
  answerJson: any;
}

/**
 * PUT /api/exam/session/:sessionId/answers
 * TASK-10 Section 5: 답안 저장
 * ACID T2-02: 소유권 검증을 트랜잭션 내에서 수행
 * ACID T1-08: 멱등 upsert
 */
export async function saveAnswers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const sessionId = req.params.sessionId as string;
    const { answers } = req.body as { answers: AnswerItem[] };

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new AppError(400, '저장할 답안이 없습니다');
    }

    const savedAnswers = await prisma.$transaction(async (tx) => {
      // ACID T2-02: 소유권 검증을 트랜잭션 내에서 수행
      const session = await tx.examSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new AppError(404, '세션을 찾을 수 없습니다');
      }

      if (session.examineeId !== req.examinee!.sub) {
        throw new AppError(403, '본인의 세션만 접근할 수 있습니다');
      }

      if (session.status !== 'IN_PROGRESS') {
        throw new AppError(409, '진행중인 세션이 아닙니다. 답안을 저장할 수 없습니다');
      }

      // ACID T1-08: 멱등 upsert — sessionId + questionBankId unique
      const upsertPromises = answers.map((answer) =>
        tx.answer.upsert({
          where: {
            sessionId_questionBankId: {
              sessionId: sessionId as string,
              questionBankId: answer.questionBankId as string,
            },
          },
          update: {
            answerJson: answer.answerJson,
            section: answer.section,
            questionIndex: answer.questionIndex,
            savedAt: new Date(),
          },
          create: {
            sessionId: sessionId as string,
            questionBankId: answer.questionBankId as string,
            section: answer.section,
            questionIndex: answer.questionIndex,
            answerJson: answer.answerJson,
          },
        }),
      );

      return Promise.all(upsertPromises);
    });

    res.json({
      success: true,
      data: {
        savedCount: savedAnswers.length,
        answers: savedAnswers,
      },
    });
  } catch (err) {
    next(err);
  }
}
