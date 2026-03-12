/**
 * GET /api/admin/question-types
 * 문제 유형 설정 목록 반환
 */
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { defaultQuestionTypes } from '../../../config/questionTypes.config';
import type { QuestionTypeConfig } from '../../../config/questionTypes.config';

const JSON_PATH = path.join(__dirname, '../../../config/questionTypes.json');

export async function getQuestionTypes(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let types: QuestionTypeConfig[];

    if (fs.existsSync(JSON_PATH)) {
      const raw = fs.readFileSync(JSON_PATH, 'utf-8');
      types = JSON.parse(raw);
    } else {
      types = defaultQuestionTypes;
    }

    res.json({ success: true, data: types });
  } catch (err) {
    next(err);
  }
}
