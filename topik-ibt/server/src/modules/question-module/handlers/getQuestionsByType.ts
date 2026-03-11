import { Request, Response, NextFunction } from 'express';
import { fetchQuestionsByType, QuestionBankQuery } from '../questionBankClient';

/**
 * GET /api/question-bank/questions
 * 문제은행에서 유형별 문제 목록 조회
 *
 * Query params: typeCode, difficulty, keyword, count, page
 */
export async function getQuestionsByType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query: QuestionBankQuery = {
      typeCode: req.query.typeCode as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
      keyword: req.query.keyword as string | undefined,
      count: req.query.count ? Number(req.query.count) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    };

    const result = await fetchQuestionsByType(query);

    res.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: query.page ?? 1,
        count: query.count ?? 20,
      },
    });
  } catch (err) {
    next(err);
  }
}
