import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

/**
 * GET /api/exam/sessions/:sessionId/questions?section=READING
 * 시험 문제 조회 — snapshotJson 에서 해당 섹션 문제를 클라이언트용으로 변환하여 반환
 * 정답(correctAnswer)은 제외하고 전달
 */
export async function getSessionQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const sessionId = req.params.sessionId as string;
    const section = (req.query.section as string || '').toUpperCase();

    if (!section) {
      throw new AppError(400, 'section 파라미터가 필요합니다 (LISTENING, READING, WRITING)');
    }

    // 세션 + 시험세트 조회
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        examSet: {
          select: {
            id: true,
            snapshotJson: true,
            sectionsJson: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, '시험 세션을 찾을 수 없습니다');
    }

    // 본인 세션인지 확인
    if (session.examineeId !== req.examinee.sub) {
      throw new AppError(403, '본인의 시험 세션만 조회할 수 있습니다');
    }

    const snapshot = session.examSet.snapshotJson as any;

    if (!snapshot) {
      throw new AppError(404, '시험 문제 데이터가 없습니다');
    }

    // snapshotJson 구조 분기:
    // Case 1: topik210 seed 형식 — { questionList: [...], examTextList: [...] }
    // Case 2: question-module upload 형식 — Array<{ sectionCode, questionsSnapshot }>
    let questions: any[] = [];
    let passages: any[] = [];

    if (Array.isArray(snapshot)) {
      // Case 2: question-module upload 형식
      const sectionData = snapshot.find((s: any) => s.sectionCode === section);
      if (!sectionData) {
        throw new AppError(404, `${section} 섹션 데이터를 찾을 수 없습니다`);
      }
      questions = (sectionData.questionsSnapshot || []).map((q: any, idx: number) => ({
        questionId: q.bankId || `${section}_Q${String(idx + 1).padStart(3, '0')}`,
        bankId: q.bankId || `${section}_Q${String(idx + 1).padStart(3, '0')}`,
        section,
        questionType: mapQuestionType(q),
        questionNumber: idx + 1,
        instruction: q.question || q.instruction || '',
        passageText: q.passage || q.passageText || '',
        options: (q.options || q.choices || []).map((opt: any, oi: number) => ({
          id: opt.id ?? oi + 1,
          text: opt.text || opt.label || '',
        })),
      }));
    } else if (snapshot.questionList) {
      // Case 1: topik210 seed 형식
      if (section !== 'READING') {
        throw new AppError(404, `이 시험세트에는 ${section} 섹션이 없습니다`);
      }

      const examTextList = snapshot.examTextList || [];
      const questionList = snapshot.questionList || [];
      const sectionsJson = session.examSet.sectionsJson as any;

      // sectionsJson에서 bankId 목록 가져오기 (채점 매칭용)
      const sectionDef = sectionsJson?.READING || sectionsJson?.reading;
      const bankIdList: string[] = sectionDef?.questions?.map((q: any) => q.bankId) || [];

      // examTextList → 지문 매핑 (startQuestSeq ~ endQuestSeq)
      const passageMap = new Map<number, { title: string; textArea: string }>();
      for (const et of examTextList) {
        for (let seq = et.startQuestSeq; seq <= et.endQuestSeq; seq++) {
          passageMap.set(seq, { title: et.title, textArea: et.textArea });
        }
      }

      questions = questionList.map((q: any, idx: number) => {
        const passage = passageMap.get(q.questSeq);
        let passageText = q.questExplain || '';
        if (passage) {
          passageText = passage.textArea + (q.questExplain ? '\n\n' + q.questExplain : '');
        }

        // bankId는 sectionsJson과 동일한 것을 사용 (채점 매칭)
        const bankId = bankIdList[idx] || `TOPIK2_R_Q${String(q.questSeq).padStart(3, '0')}`;

        return {
          questionId: bankId,
          bankId,
          section: 'READING',
          questionType: 'MCQ_SINGLE' as const,
          questionNumber: q.questSeq,
          instruction: q.quest,
          passageText,
          options: (q.item || []).map((item: any) => ({
            id: item.itemNo,
            text: item.itemExample,
          })),
          points: q.allot,
        };
      });
    } else {
      throw new AppError(500, '알 수 없는 snapshotJson 형식입니다');
    }

    res.json({
      success: true,
      data: {
        section,
        questionCount: questions.length,
        questions,
      },
    });
  } catch (err) {
    next(err);
  }
}

function mapQuestionType(q: any): string {
  if (q.questionType) return q.questionType;
  if (q.type) return q.type;
  // Default fallback
  return 'MCQ_SINGLE';
}
