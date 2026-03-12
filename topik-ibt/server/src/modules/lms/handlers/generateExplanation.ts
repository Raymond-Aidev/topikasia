/**
 * POST /api/lms/sessions/:sessionId/explain/:questionBankId
 * LMS-05~06: LLM 해설 생성 (최초 요청 시 생성, 이후 캐시)
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/types';

async function callLLM(prompt: string, maxTokens: number = 1024): Promise<{ explanation: string; model: string }> {
  const apiKey = env.LLM_API_KEY;
  const provider = env.LLM_PROVIDER || 'openai'; // openai or anthropic

  if (!apiKey) {
    return {
      explanation: '해설 서비스가 설정되지 않았습니다. 관리자에게 문의하세요.',
      model: 'none',
    };
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.LLM_MODEL || 'claude-sonnet-4-5-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json() as any;
    return {
      explanation: data.content?.[0]?.text || '해설을 생성할 수 없습니다.',
      model: env.LLM_MODEL || 'claude-sonnet-4-5-20250514',
    };
  }

  // OpenAI (default)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json() as any;
  return {
    explanation: data.choices?.[0]?.message?.content || '해설을 생성할 수 없습니다.',
    model: env.LLM_MODEL || 'gpt-4o',
  };
}

export async function generateExplanation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) throw new AppError(401, '인증이 필요합니다');

    const sessionId = req.params.sessionId as string;
    const questionBankId = req.params.questionBankId as string;

    // 소유권 확인
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      select: { examineeId: true, status: true, examSet: { select: { sectionsJson: true } } },
    });
    if (!session) throw new AppError(404, '세션을 찾을 수 없습니다');
    if (session.examineeId !== req.examinee.sub) throw new AppError(403, '접근 권한이 없습니다');
    if (session.status !== 'COMPLETED') throw new AppError(400, '완료된 시험만 해설을 볼 수 있습니다');

    // 캐시 확인
    const cached = await prisma.questionExplanation.findUnique({
      where: { sessionId_questionBankId: { sessionId, questionBankId } },
    });
    if (cached) {
      res.json({ explanation: cached.explanation, cached: true });
      return;
    }

    // 답안 조회
    const answer = await prisma.answer.findUnique({
      where: { sessionId_questionBankId: { sessionId, questionBankId } },
    });

    // 정답 추출
    const sectionsJson = session.examSet.sectionsJson as any;
    let correctAnswer: any = null;
    let typeCode = '';
    const sections = Array.isArray(sectionsJson) ? sectionsJson : Object.values(sectionsJson);
    for (const sec of sections) {
      for (const q of (sec.questions || [])) {
        if (q.bankId === questionBankId) {
          correctAnswer = q.correctAnswer;
          typeCode = q.typeCode;
          break;
        }
      }
    }

    // Determine if this is a writing (essay/short answer) question
    const sectionName = (() => {
      for (const sec of sections) {
        for (const q of (sec.questions || [])) {
          if (q.bankId === questionBankId) return (sec.section || sec.name || '').toUpperCase();
        }
      }
      return '';
    })();
    const isWritingQuestion =
      typeCode.startsWith('ESSAY') ||
      typeCode.startsWith('SHORT_ANSWER') ||
      sectionName.includes('WRITING');

    // LLM 프롬프트
    let prompt: string;
    let maxTokens: number;

    if (isWritingQuestion) {
      prompt = `당신은 한국어능력시험(TOPIK) 쓰기 영역 전문 해설 교사입니다.

문항 유형: ${typeCode}
문항 ID: ${questionBankId}
응시자 답: ${JSON.stringify(answer?.answerJson ?? '미응답')}
정답/모범답안: ${JSON.stringify(correctAnswer ?? '정답 정보 없음')}

이 쓰기 문항에 대해 다음을 포함하여 한국어로 해설해주세요:
1. 모범 답안 예시 (자연스러운 한국어로 작성된 완성된 글)
2. 채점 기준 설명 (내용, 구성, 언어 사용 등 각 영역별 평가 기준)
3. 응시자 답안에 대한 피드백 (잘한 점과 개선점)
4. 핵심 문법/표현 포인트
5. 고득점을 위한 학습 팁

상세하게 작성하세요.`;
      maxTokens = 1500;
    } else {
      prompt = `당신은 한국어능력시험(TOPIK) 전문 해설 교사입니다.

문항 유형: ${typeCode}
문항 ID: ${questionBankId}
응시자 답: ${JSON.stringify(answer?.answerJson ?? '미응답')}
정답: ${JSON.stringify(correctAnswer ?? '정답 정보 없음')}

이 문항에 대해 다음을 포함하여 한국어로 간결하게 해설해주세요:
1. 정답이 맞는 이유 (또는 틀린 이유)
2. 핵심 문법/어휘 포인트
3. 학습 팁

200자 이내로 작성하세요.`;
      maxTokens = 1024;
    }

    const { explanation, model } = await callLLM(prompt, maxTokens);

    // 캐시 저장
    await prisma.questionExplanation.create({
      data: {
        sessionId,
        questionBankId,
        examineeAnswer: (answer?.answerJson as any) ?? undefined,
        correctAnswer: (correctAnswer as any) ?? undefined,
        explanation,
        llmModel: model,
      },
    });

    res.json({ explanation, cached: false });
  } catch (err) {
    next(err);
  }
}
