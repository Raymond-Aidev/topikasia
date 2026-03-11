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
 * POST /api/exam/session/:sessionId/complete
 * TASK-10 Section 7: 세션 완료
 */
export async function completeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const sessionId = req.params.sessionId as string;

    const updatedSession = await prisma.$transaction(async (tx) => {
      const session = await tx.examSession.findUnique({
        where: { id: sessionId },
        include: { answers: true },
      });

      if (!session) {
        throw new AppError(404, '세션을 찾을 수 없습니다');
      }

      if (session.examineeId !== req.examinee!.sub) {
        throw new AppError(403, '본인의 세션만 접근할 수 있습니다');
      }

      // 이미 완료된 세션이면 멱등하게 반환
      if (session.status === 'COMPLETED') {
        return session;
      }

      if (session.status !== 'IN_PROGRESS') {
        throw new AppError(409, '진행중인 세션이 아닙니다');
      }

      // 미제출 답안 자동 제출 처리
      await tx.answer.updateMany({
        where: {
          sessionId: sessionId as string,
          submittedAt: null,
        },
        data: {
          submittedAt: new Date(),
          isAutoSubmitted: true,
        },
      });

      // 진행중인 섹션 모두 완료 처리
      const sectionProgress = session.sectionProgressJson as unknown as SectionProgress[];
      const completedProgress = sectionProgress.map((s) => {
        if (s.status === 'IN_PROGRESS') {
          return { ...s, status: 'COMPLETED' as const, completedAt: new Date().toISOString() };
        }
        return s;
      });

      return tx.examSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          sectionProgressJson: completedProgress as unknown as Prisma.InputJsonValue,
        },
        include: { answers: true },
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
