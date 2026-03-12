/**
 * POST /api/admin/scores/publish
 * 성적 공개/비공개 처리 (개별 또는 일괄)
 * body: { scoreIds: string[], isPublished: boolean }
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

export async function publishScores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scoreIds, isPublished } = req.body as { scoreIds: string[]; isPublished: boolean };

    if (!Array.isArray(scoreIds) || scoreIds.length === 0) {
      throw new AppError(400, '대상 성적을 선택해주세요');
    }

    if (typeof isPublished !== 'boolean') {
      throw new AppError(400, '공개 여부를 지정해주세요');
    }

    // 공개 시: FULLY_GRADED 상태만 허용
    if (isPublished) {
      const notReady = await prisma.score.count({
        where: {
          id: { in: scoreIds },
          gradingStatus: { not: 'FULLY_GRADED' },
        },
      });
      if (notReady > 0) {
        throw new AppError(400, `채점이 완료되지 않은 성적 ${notReady}건이 포함되어 있습니다`);
      }
    }

    const result = await prisma.score.updateMany({
      where: { id: { in: scoreIds } },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        publishedById: isPublished ? (req as any).admin?.sub : null,
        updatedAt: new Date(),
      },
    });

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        action: isPublished ? 'PUBLISH_SCORES' : 'UNPUBLISH_SCORES',
        targetType: 'Score',
        targetId: 'batch',
        detail: { scoreIds, count: result.count, adminId: (req as any).admin?.sub },
      },
    });

    res.json({
      success: true,
      data: { updatedCount: result.count },
    });
  } catch (err) {
    next(err);
  }
}
