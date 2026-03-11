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
 * POST /api/exam/session/:sessionId/submit-section
 * TASK-10 Section 6: 섹션 제출(완료)
 */
export async function submitSection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const sessionId = req.params.sessionId as string;
    const { sectionName } = req.body;

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

      const target = sectionProgress[targetIndex];

      if (target.status === 'COMPLETED') {
        // 멱등: 이미 완료된 섹션
        return session;
      }

      if (target.status !== 'IN_PROGRESS') {
        throw new AppError(409, `섹션 '${sectionName}'이 시작되지 않았습니다`);
      }

      // 해당 섹션의 답안들에 submittedAt 마킹
      await tx.answer.updateMany({
        where: {
          sessionId: sessionId as string,
          section: sectionName as string,
          submittedAt: null,
        },
        data: {
          submittedAt: new Date(),
        },
      });

      // 섹션 상태 업데이트
      sectionProgress[targetIndex] = {
        ...target,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
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
