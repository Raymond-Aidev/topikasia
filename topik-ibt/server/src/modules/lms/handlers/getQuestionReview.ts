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
        examSet: { select: { sectionsJson: true, snapshotJson: true, examType: true, name: true } },
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

    // snapshotJson에서 문제 텍스트 추출
    const snapshot = session.examSet.snapshotJson as any;
    const questionTextMap = new Map<string, {
      instruction: string;
      passageText: string;
      options: Array<{ id: number; text: string }>;
    }>();

    if (snapshot?.questionList) {
      // topik210 seed 형식
      const examTextList = snapshot.examTextList || [];
      const passageMap = new Map<number, string>();
      for (const et of examTextList) {
        for (let seq = et.startQuestSeq; seq <= et.endQuestSeq; seq++) {
          passageMap.set(seq, et.textArea);
        }
      }

      // sectionsJson에서 bankId 목록 매칭
      const sectionDef = (sectionsJson as any)?.READING || (sectionsJson as any)?.reading;
      const bankIdList: string[] = sectionDef?.questions?.map((q: any) => q.bankId) || [];

      snapshot.questionList.forEach((q: any, idx: number) => {
        const bankId = bankIdList[idx] || `TOPIK2_R_Q${String(q.questSeq).padStart(3, '0')}`;
        const passage = passageMap.get(q.questSeq);
        let passageText = q.questExplain || '';
        if (passage) {
          passageText = passage + (q.questExplain ? '\n\n' + q.questExplain : '');
        }

        questionTextMap.set(bankId, {
          instruction: q.quest,
          passageText,
          options: (q.item || []).map((item: any) => ({
            id: item.itemNo,
            text: item.itemExample,
          })),
        });
      });
    } else if (Array.isArray(snapshot)) {
      // question-module upload 형식
      for (const sec of snapshot) {
        for (const q of (sec.questionsSnapshot || [])) {
          questionTextMap.set(q.bankId, {
            instruction: q.question || q.instruction || '',
            passageText: q.passage || q.passageText || '',
            options: (q.options || q.choices || []).map((opt: any, i: number) => ({
              id: opt.id ?? i + 1,
              text: opt.text || opt.label || '',
            })),
          });
        }
      }
    }

    // 캐시된 해설 맵
    const explanationMap = new Map(
      session.explanations.map((e: any) => [e.questionBankId, e.explanation]),
    );

    const questions = session.answers.map(a => {
      const questionInfo = correctAnswerMap.get(a.questionBankId);
      const questionText = questionTextMap.get(a.questionBankId);

      // MCQ 답안 비교: selectedOptions 형식 대응
      let isCorrect: boolean | null = null;
      if (questionInfo?.correctAnswer != null) {
        const userAnswer = a.answerJson as any;
        if (userAnswer?.selectedOptions?.length > 0) {
          isCorrect = userAnswer.selectedOptions[0] === questionInfo.correctAnswer;
        } else if (typeof userAnswer === 'number') {
          isCorrect = userAnswer === questionInfo.correctAnswer;
        } else {
          isCorrect = JSON.stringify(a.answerJson) === JSON.stringify(questionInfo.correctAnswer);
        }
      }

      return {
        answerId: a.id,
        questionBankId: a.questionBankId,
        section: a.section,
        questionIndex: a.questionIndex,
        examineeAnswer: a.answerJson,
        correctAnswer: questionInfo?.correctAnswer ?? null,
        typeCode: questionInfo?.typeCode ?? null,
        isCorrect,
        explanation: explanationMap.get(a.questionBankId) || null,
        // 문제 텍스트 (LMS 복습용)
        instruction: questionText?.instruction ?? null,
        passageText: questionText?.passageText ?? null,
        options: questionText?.options ?? null,
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
