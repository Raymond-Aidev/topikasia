/**
 * GET /api/admin/monitor/realtime
 * 실시간 모니터링 데이터 (현재 시험중 응시자 상태)
 * MONITOR-05: 실시간 상태 (온라인/오프라인/제출완료)
 */
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';

export async function getRealtimeMonitor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const examSetId = req.query.examSetId as string | undefined;

    // 진행중인 세션 조회
    const where: any = { status: 'IN_PROGRESS' };
    if (examSetId) where.examSetId = examSetId;

    const sessions = await prisma.examSession.findMany({
      where,
      include: {
        examinee: {
          select: {
            name: true,
            loginId: true,
            registrationNumber: true,
            seatNumber: true,
            institutionName: true,
            examRoomName: true,
          },
        },
        examSet: {
          select: { name: true, examType: true, examSetNumber: true },
        },
        answers: {
          select: { section: true, submittedAt: true },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    // 완료된 세션도 최근 것 포함
    const recentCompleted = await prisma.examSession.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 최근 2시간
        ...(examSetId ? { examSetId } : {}),
      },
      include: {
        examinee: {
          select: { name: true, loginId: true, registrationNumber: true, seatNumber: true },
        },
        examSet: {
          select: { name: true, examSetNumber: true },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });

    // 세션별 현재 영역 상태 계산
    const liveExaminees = sessions.map(session => {
      const progress = session.sectionProgressJson as any[];
      const currentSection = progress?.find((s: any) => s.status === 'IN_PROGRESS');
      const completedSections = progress?.filter((s: any) => s.status === 'COMPLETED') || [];
      const submittedAnswerCount = session.answers.filter(a => a.submittedAt).length;
      const totalAnswerCount = session.answers.length;

      return {
        sessionId: session.id,
        examinee: session.examinee,
        examSet: session.examSet,
        startedAt: session.startedAt,
        currentSection: currentSection?.sectionName || null,
        completedSections: completedSections.map((s: any) => s.sectionName),
        sectionProgress: progress,
        submittedAnswerCount,
        totalAnswerCount,
        status: 'IN_PROGRESS' as const,
      };
    });

    const completedExaminees = recentCompleted.map(session => ({
      sessionId: session.id,
      examinee: session.examinee,
      examSet: session.examSet,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      status: 'COMPLETED' as const,
    }));

    // 통계
    const stats = {
      inProgress: sessions.length,
      completedRecent: recentCompleted.length,
      totalActive: sessions.length + recentCompleted.length,
    };

    res.json({
      success: true,
      data: {
        stats,
        liveExaminees,
        completedExaminees,
      },
    });
  } catch (err) {
    next(err);
  }
}
