/**
 * PUT /api/questions/question-module/exam-sets/:id/model-answer
 * 모범답안 및 채점 기준 업데이트
 * body: { questionBankId: string, modelAnswer: string, scoringCriteria: string }
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

export async function updateModelAnswer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError(401, '관리자 인증이 필요합니다');
    }

    const id = req.params.id as string;
    const { questionBankId, modelAnswer, scoringCriteria } = req.body as {
      questionBankId: string;
      modelAnswer: string;
      scoringCriteria: string;
    };

    if (!questionBankId) {
      throw new AppError(400, 'questionBankId는 필수입니다');
    }

    const examSet = await prisma.examSet.findUnique({ where: { id } });
    if (!examSet) {
      throw new AppError(404, '시험세트를 찾을 수 없습니다');
    }

    // sectionsJson 내에서 해당 questionBankId를 찾아 modelAnswer, scoringCriteria 추가
    const sectionsJson = examSet.sectionsJson as any[];

    let found = false;
    for (const section of sectionsJson) {
      const questions = section.questions || section.questionBankIds || [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        // questions 배열이 문자열(bankId)인 경우 객체로 변환
        const bankId = typeof q === 'string' ? q : q.bankId || q.questionBankId;
        if (bankId === questionBankId) {
          if (typeof q === 'string') {
            questions[i] = {
              questionBankId: q,
              modelAnswer: modelAnswer || '',
              scoringCriteria: scoringCriteria || '',
            };
          } else {
            questions[i] = {
              ...q,
              modelAnswer: modelAnswer || '',
              scoringCriteria: scoringCriteria || '',
            };
          }
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      throw new AppError(404, '해당 문항을 시험세트에서 찾을 수 없습니다');
    }

    const updated = await prisma.examSet.update({
      where: { id },
      data: { sectionsJson },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_MODEL_ANSWER',
        targetType: 'ExamSet',
        targetId: id,
        detail: { questionBankId, adminId: req.admin.sub },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
