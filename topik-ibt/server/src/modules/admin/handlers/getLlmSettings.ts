import { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env';

/**
 * GET /api/admin/llm-settings
 * LLM 설정 정보 조회 (API 키는 노출하지 않음)
 */
export async function getLlmSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({
      success: true,
      data: {
        provider: env.LLM_PROVIDER,
        model: env.LLM_MODEL || (env.LLM_PROVIDER === 'anthropic' ? 'claude-sonnet-4-5-20250514' : 'gpt-4o'),
        hasApiKey: !!env.LLM_API_KEY,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/llm-settings/test
 * LLM 해설 테스트 - 간단한 테스트 프롬프트를 LLM에 보내 동작 확인
 */
export async function testLlmExplanation(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apiKey = env.LLM_API_KEY;
    const provider = env.LLM_PROVIDER || 'openai';

    if (!apiKey) {
      res.json({
        success: true,
        data: {
          result: 'error',
          message: 'LLM API 키가 설정되지 않았습니다.',
        },
      });
      return;
    }

    const testPrompt = '한국어능력시험(TOPIK) 읽기 영역에서 자주 출제되는 문법 포인트 3가지를 간단히 설명해주세요. 100자 이내로 작성하세요.';

    let explanation = '';
    let model = '';

    if (provider === 'anthropic') {
      model = env.LLM_MODEL || 'claude-sonnet-4-5-20250514';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 256,
          messages: [{ role: 'user', content: testPrompt }],
        }),
      });
      const data = await response.json() as any;
      explanation = data.content?.[0]?.text || '응답을 생성할 수 없습니다.';
    } else {
      model = env.LLM_MODEL || 'gpt-4o';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 256,
        }),
      });
      const data = await response.json() as any;
      explanation = data.choices?.[0]?.message?.content || '응답을 생성할 수 없습니다.';
    }

    res.json({
      success: true,
      data: {
        result: 'ok',
        model,
        explanation,
      },
    });
  } catch (err) {
    next(err);
  }
}
