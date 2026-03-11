import { prisma } from '../config/database';

interface SectionProgress {
  sectionCode: string;
  sectionName: string;
  timeLimitMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

const GRACE_PERIOD_SECONDS = 30;

/**
 * 만료된 섹션 자동 제출 (ACID T3-04)
 *
 * 진행 중인 시험 세션에서 섹션 시간이 초과된 경우
 * grace period(30초) 이후 자동으로 해당 섹션을 완료 처리합니다.
 *
 * 주기적으로 실행되어야 합니다 (예: setInterval, cron)
 */
export async function autoSubmitExpiredSections(): Promise<void> {
  const now = new Date();

  // 진행 중인 세션 조회
  const activeSessions = await prisma.examSession.findMany({
    where: { status: 'IN_PROGRESS' },
    select: {
      id: true,
      examineeId: true,
      examSetId: true,
      sectionProgressJson: true,
      startedAt: true,
    },
  });

  for (const session of activeSessions) {
    const sectionProgress = session.sectionProgressJson as unknown as SectionProgress[];

    if (!Array.isArray(sectionProgress)) continue;

    let hasChanges = false;

    for (const section of sectionProgress) {
      if (section.status !== 'IN_PROGRESS' || !section.startedAt) continue;

      const sectionStart = new Date(section.startedAt);
      const timeLimitMs = section.timeLimitMinutes * 60 * 1000;
      const graceMs = GRACE_PERIOD_SECONDS * 1000;
      const deadline = new Date(sectionStart.getTime() + timeLimitMs + graceMs);

      if (now >= deadline) {
        console.log(
          `[AutoSubmit] 섹션 자동 제출: 세션 ${session.id}, 섹션 ${section.sectionCode}`,
        );

        // 섹션 완료 처리
        section.status = 'COMPLETED';
        section.completedAt = now.toISOString();
        hasChanges = true;

        // 해당 섹션의 미제출 답안 자동 제출 처리
        await prisma.answer.updateMany({
          where: {
            sessionId: session.id,
            section: section.sectionCode,
            submittedAt: null,
          },
          data: {
            submittedAt: now,
            isAutoSubmitted: true,
          },
        });

        // ACID T3-04: 감사 로그 생성
        await prisma.auditLog.create({
          data: {
            action: 'AUTO_SUBMIT_SECTION',
            targetType: 'ExamSession',
            targetId: session.id,
            detail: {
              examineeId: session.examineeId,
              examSetId: session.examSetId,
              sectionCode: section.sectionCode,
              sectionName: section.sectionName,
              reason: '섹션 시간 초과 (자동 제출)',
              sectionStartedAt: section.startedAt,
              deadline: deadline.toISOString(),
              autoSubmittedAt: now.toISOString(),
              gracePeriodSeconds: GRACE_PERIOD_SECONDS,
            },
          },
        });
      }
    }

    if (hasChanges) {
      // 모든 섹션이 완료되었는지 확인
      const allCompleted = sectionProgress.every(
        (s) => s.status === 'COMPLETED',
      );

      await prisma.examSession.update({
        where: { id: session.id },
        data: {
          sectionProgressJson: sectionProgress as unknown as object,
          ...(allCompleted
            ? { status: 'COMPLETED', completedAt: now }
            : {}),
        },
      });

      if (allCompleted) {
        console.log(
          `[AutoSubmit] 세션 완료 처리: ${session.id} (모든 섹션 시간 초과)`,
        );

        await prisma.auditLog.create({
          data: {
            action: 'AUTO_COMPLETE_SESSION',
            targetType: 'ExamSession',
            targetId: session.id,
            detail: {
              examineeId: session.examineeId,
              examSetId: session.examSetId,
              reason: '모든 섹션 시간 초과로 인한 자동 완료',
              completedAt: now.toISOString(),
            },
          },
        });
      }
    }
  }
}
