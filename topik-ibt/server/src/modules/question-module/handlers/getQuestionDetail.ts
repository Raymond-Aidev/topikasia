import { Request, Response, NextFunction } from 'express';
import { fetchQuestionDetail } from '../questionBankClient';
import { AppError } from '../../../shared/types';

/**
 * GET /api/question-bank/questions/:bankId
 * 문제은행에서 개별 문제 상세 조회
 */
export async function getQuestionDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bankId = req.params.bankId as string;

    if (!bankId) {
      throw new AppError(400, '문제 ID가 필요합니다');
    }

    const detail = await fetchQuestionDetail(bankId);

    res.json({
      success: true,
      data: detail,
    });
  } catch (err) {
    next(err);
  }
}
