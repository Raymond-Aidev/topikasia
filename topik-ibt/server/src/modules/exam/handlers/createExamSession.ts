import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/types';

/**
 * POST /api/exam/session
 * TASK-10 Section 3: 시험 세션 생성
 * SYNC-06: 늦은 입장 차단
 * ACID T1-02: TOCTOU-safe — DB unique constraint 활용
 */
export async function createExamSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.examinee) {
      throw new AppError(401, '인증이 필요합니다');
    }

    const examineeId = req.examinee.sub;

    // 응시자 및 배정된 시험세트 조회
    const examinee = await prisma.examinee.findUnique({
      where: { id: examineeId },
      include: { assignedExamSet: true },
    });

    if (!examinee) {
      throw new AppError(404, '응시자를 찾을 수 없습니다');
    }

    if (!examinee.assignedExamSet) {
      throw new AppError(404, '배정된 시험세트가 없습니다');
    }

    const examSet = examinee.assignedExamSet;

    if (examSet.status !== 'ACTIVE') {
      throw new AppError(403, '시험세트가 활성화되지 않았습니다');
    }

    // SYNC-06: 늦은 입장 차단 — scheduledStartAt + graceSeconds 이후에는 세션 생성 불가
    if (examSet.scheduledStartAt) {
      const graceMs = env.EXAM_LATE_GRACE_SECONDS * 1000;
      const deadline = new Date(examSet.scheduledStartAt.getTime() + graceMs);
      if (new Date() > deadline) {
        throw new AppError(403, '시험 시작 시간이 지났습니다. 입장이 불가합니다');
      }
    }

    // 기존 진행중인 세션 확인 — 있으면 해당 세션 반환 (멱등성)
    const existingSession = await prisma.examSession.findFirst({
      where: {
        examineeId,
        examSetId: examSet.id,
        status: 'IN_PROGRESS',
      },
      include: { answers: true },
    });

    if (existingSession) {
      res.json({
        success: true,
        data: existingSession,
        message: '기존 진행중인 세션을 반환합니다',
      });
      return;
    }

    // sectionsJson에서 초기 sectionProgressJson 생성
    const sections = examSet.sectionsJson as Array<{ sectionName: string; durationSeconds: number }>;
    const sectionProgress = sections.map((s) => ({
      sectionName: s.sectionName,
      status: 'NOT_STARTED' as const,
      startedAt: null,
      completedAt: null,
    }));

    // ACID T1-02: TOCTOU-safe 세션 생성 — unique constraint 충돌 시 기존 세션 반환
    try {
      const session = await prisma.examSession.create({
        data: {
          examineeId,
          examSetId: examSet.id,
          status: 'IN_PROGRESS',
          sectionProgressJson: sectionProgress,
        },
        include: { answers: true },
      });

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (err: any) {
      // Prisma unique constraint violation
      if (err.code === 'P2002') {
        const fallbackSession = await prisma.examSession.findFirst({
          where: {
            examineeId,
            examSetId: examSet.id,
            status: 'IN_PROGRESS',
          },
          include: { answers: true },
        });

        if (fallbackSession) {
          res.json({
            success: true,
            data: fallbackSession,
            message: '기존 진행중인 세션을 반환합니다',
          });
          return;
        }
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
