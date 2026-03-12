/**
 * PUT /api/admin/question-types
 * 문제 유형 활성/비활성 상태 업데이트
 * body: { updates: [{ code: string, isActive: boolean }] }
 */
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { defaultQuestionTypes } from '../../../config/questionTypes.config';
import type { QuestionTypeConfig } from '../../../config/questionTypes.config';
import { AppError } from '../../../shared/types';

const JSON_PATH = path.join(__dirname, '../../../config/questionTypes.json');

export async function updateQuestionTypes(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { updates } = req.body as {
      updates: { code: string; isActive: boolean }[];
    };

    if (!updates || !Array.isArray(updates)) {
      throw new AppError(400, 'updates 배열이 필요합니다');
    }

    // 현재 설정 로드
    let types: QuestionTypeConfig[];
    if (fs.existsSync(JSON_PATH)) {
      const raw = fs.readFileSync(JSON_PATH, 'utf-8');
      types = JSON.parse(raw);
    } else {
      types = [...defaultQuestionTypes];
    }

    // 업데이트 적용
    const updateMap = new Map(updates.map((u) => [u.code, u.isActive]));
    for (const t of types) {
      if (updateMap.has(t.code)) {
        t.isActive = updateMap.get(t.code)!;
      }
    }

    // JSON 파일에 저장
    fs.writeFileSync(JSON_PATH, JSON.stringify(types, null, 2), 'utf-8');

    res.json({ success: true, data: types });
  } catch (err) {
    next(err);
  }
}
