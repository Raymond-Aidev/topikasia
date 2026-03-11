import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../config/database';
import { env } from '../config/env';

interface ActiveCountdown {
  examSetId: string;
  scheduledStartAt: Date;
  intervalId: NodeJS.Timeout;
  started: boolean;
}

// 활성 카운트다운 추적
const activeCountdowns = new Map<string, ActiveCountdown>();

const POLL_INTERVAL_MS = 30_000; // 30초 폴링
const COUNTDOWN_SECONDS = 10; // 카운트다운 시작 시점 (시험 시작 전 N초)

/**
 * 카운트다운 스케줄러 시작
 * - 30초마다 scheduledStartAt이 임박한 ExamSet 조회
 * - T-10s: 1초 간격으로 exam:countdown 이벤트 전송
 * - T=0: exam:start 이벤트 전송
 */
export function startCountdownScheduler(io: SocketIOServer): void {
  const countdownSec = env.EXAM_COUNTDOWN_SECONDS ?? COUNTDOWN_SECONDS;

  console.log('[Scheduler] 카운트다운 스케줄러 시작 (폴링 주기: 30초)');

  const pollInterval = setInterval(async () => {
    try {
      await pollUpcomingExamSets(io, countdownSec);
    } catch (err) {
      console.error('[Scheduler] 폴링 에러:', err);
    }
  }, POLL_INTERVAL_MS);

  // 최초 즉시 실행
  pollUpcomingExamSets(io, countdownSec).catch((err) =>
    console.error('[Scheduler] 초기 폴링 에러:', err),
  );

  // 프로세스 종료 시 정리
  process.on('SIGTERM', () => {
    clearInterval(pollInterval);
    for (const [, countdown] of activeCountdowns) {
      clearInterval(countdown.intervalId);
    }
    activeCountdowns.clear();
  });
}

async function pollUpcomingExamSets(
  io: SocketIOServer,
  countdownSec: number,
): Promise<void> {
  const now = new Date();
  // 앞으로 countdownSec + 여유 60초 이내에 시작 예정인 시험세트 조회
  const lookAheadMs = (countdownSec + 60) * 1000;
  const cutoff = new Date(now.getTime() + lookAheadMs);

  const upcomingExamSets = await prisma.examSet.findMany({
    where: {
      status: { in: ['UPLOADED', 'ACTIVE'] },
      scheduledStartAt: {
        gte: now,
        lte: cutoff,
      },
    },
    select: {
      id: true,
      scheduledStartAt: true,
      examSetNumber: true,
    },
  });

  for (const examSet of upcomingExamSets) {
    if (!examSet.scheduledStartAt) continue;
    if (activeCountdowns.has(examSet.id)) continue;

    const msUntilStart = examSet.scheduledStartAt.getTime() - Date.now();
    const msUntilCountdown = msUntilStart - countdownSec * 1000;

    if (msUntilCountdown <= 0 && msUntilStart > 0) {
      // 이미 카운트다운 시점 지남 → 즉시 카운트다운 시작
      startCountdown(io, examSet.id, examSet.scheduledStartAt, countdownSec);
    } else if (msUntilCountdown > 0 && msUntilCountdown <= POLL_INTERVAL_MS + 5000) {
      // 다음 폴링 전에 카운트다운 시작해야 함 → 타이머 예약
      console.log(
        `[Scheduler] ${examSet.examSetNumber}: ${Math.round(msUntilCountdown / 1000)}초 후 카운트다운 시작 예약`,
      );
      setTimeout(() => {
        startCountdown(io, examSet.id, examSet.scheduledStartAt!, countdownSec);
      }, msUntilCountdown);
    }
  }
}

function startCountdown(
  io: SocketIOServer,
  examSetId: string,
  scheduledStartAt: Date,
  countdownSec: number,
): void {
  if (activeCountdowns.has(examSetId)) return;

  const examNsp = io.of('/exam');
  const room = `waiting:${examSetId}`;

  console.log(`[Scheduler] 카운트다운 시작: ${examSetId}`);

  const countdown: ActiveCountdown = {
    examSetId,
    scheduledStartAt,
    started: false,
    intervalId: setInterval(() => {
      const remaining = Math.round(
        (scheduledStartAt.getTime() - Date.now()) / 1000,
      );

      if (remaining > 0) {
        examNsp.to(room).emit('exam:countdown', {
          examSetId,
          remaining,
          scheduledStartAt: scheduledStartAt.toISOString(),
        });
      } else if (!countdown.started) {
        // T=0: 시험 시작
        countdown.started = true;
        examNsp.to(room).emit('exam:start', {
          examSetId,
          startedAt: new Date().toISOString(),
        });
        console.log(`[Scheduler] 시험 시작 이벤트 전송: ${examSetId}`);

        // 정리: 시작 후 5초 뒤에 카운트다운 제거
        setTimeout(() => {
          clearInterval(countdown.intervalId);
          activeCountdowns.delete(examSetId);
          console.log(`[Scheduler] 카운트다운 정리: ${examSetId}`);
        }, 5000);
      }
    }, 1000),
  };

  activeCountdowns.set(examSetId, countdown);
}
