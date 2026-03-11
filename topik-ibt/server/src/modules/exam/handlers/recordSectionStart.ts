import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/types';

interface SectionProgress {
  sectionName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * POST /api/exam/session/:sessionId/section-start
 * TASK-10 Section 4: 섹션 시작 기록
 * ACID T2-05: 섹션 순서 검증
 */
export async function recordSectionStart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const sessionId = req.params.sessionId as string;
    const { sectionName } = req.body;

    // 트랜잭션 내에서 세션 조회 및 업데이트
    const updatedSession = await prisma.$transaction(async (tx) => {
      const session = await tx.examSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new AppError(404, '세션을 찾을 수 없습니다');
      }

      if (session.examineeId !== req.examinee!.sub) {
        throw new AppError(403, '본인의 세션만 접근할 수 있습니다');
      }

      if (session.status !== 'IN_PROGRESS') {
        throw new AppError(409, '진행중인 세션이 아닙니다');
      }

      const sectionProgress = session.sectionProgressJson as unknown as SectionProgress[];
      const targetIndex = sectionProgress.findIndex((s) => s.sectionName === sectionName);

      if (targetIndex === -1) {
        throw new AppError(404, `섹션 '${sectionName}'을 찾을 수 없습니다`);
      }

      // ACID T2-05: 섹션 순서 검증 — 이전 섹션이 모두 COMPLETED여야 함
      for (let i = 0; i < targetIndex; i++) {
        if (sectionProgress[i].status !== 'COMPLETED') {
          throw new AppError(409, `이전 섹션 '${sectionProgress[i].sectionName}'이 완료되지 않았습니다`);
        }
      }

      const target = sectionProgress[targetIndex];

      // 이미 시작된 섹션이면 멱등하게 반환
      if (target.status === 'IN_PROGRESS') {
        return session;
      }

      if (target.status === 'COMPLETED') {
        throw new AppError(409, `섹션 '${sectionName}'은 이미 완료되었습니다`);
      }

      // 섹션 시작 기록
      sectionProgress[targetIndex] = {
        ...target,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
      };

      return tx.examSession.update({
        where: { id: sessionId },
        data: { sectionProgressJson: sectionProgress as unknown as Prisma.InputJsonValue },
      });
    });

    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (err) {
    next(err);
  }
}
