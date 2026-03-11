import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyExamineeToken, verifyAdminToken } from '../shared/utils/jwt';
import { AdminTokenPayload, ExamineeTokenPayload } from '../shared/types';
import { startCountdownScheduler } from './countdownScheduler';

// Socket 확장 타입
interface ExamSocket extends Socket {
  data: {
    examinee?: ExamineeTokenPayload;
    admin?: AdminTokenPayload;
  };
}

/**
 * WebSocket 초기화
 * - /exam 네임스페이스: 응시자용 (시험 동시 시작, 시간 동기화)
 * - /proctor 네임스페이스: 감독관용 (퇴실 허용, 강제 종료)
 */
export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  // ─── /exam 네임스페이스 (응시자용) ────────────────────────
  const examNsp = io.of('/exam');

  examNsp.use((socket: ExamSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('인증 토큰이 필요합니다'));
      }

      const payload = verifyExamineeToken(token);
      socket.data.examinee = payload;
      next();
    } catch {
      next(new Error('유효하지 않은 인증 토큰입니다'));
    }
  });

  examNsp.on('connection', (socket: ExamSocket) => {
    const examinee = socket.data.examinee!;
    console.log(`[WS/exam] 응시자 연결: ${examinee.loginId} (${socket.id})`);

    // 대기실 참가
    socket.on('waiting:join', (data: { examSetId: string }) => {
      const room = `waiting:${data.examSetId}`;
      socket.join(room);
      console.log(`[WS/exam] ${examinee.loginId} → ${room} 입장`);

      // 현재 대기실 인원수 전송
      const roomSize = examNsp.adapter.rooms.get(room)?.size ?? 0;
      examNsp.to(room).emit('waiting:count', { count: roomSize });
    });

    // 시간 동기화 요청
    socket.on('sync:time', (_data, callback) => {
      if (typeof callback === 'function') {
        callback({ serverTime: Date.now() });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WS/exam] 응시자 연결 해제: ${examinee.loginId} (${socket.id})`);
    });
  });

  // ─── /proctor 네임스페이스 (감독관용) ─────────────────────
  const proctorNsp = io.of('/proctor');

  proctorNsp.use((socket: ExamSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('관리자 인증 토큰이 필요합니다'));
      }

      const payload = verifyAdminToken(token);

      // PROCTOR 이상 권한 확인
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PROCTOR'];
      if (!allowedRoles.includes(payload.role)) {
        return next(new Error('감독관 권한이 필요합니다'));
      }

      socket.data.admin = payload;
      next();
    } catch {
      next(new Error('유효하지 않은 관리자 토큰입니다'));
    }
  });

  proctorNsp.on('connection', (socket: ExamSocket) => {
    const admin = socket.data.admin!;
    console.log(`[WS/proctor] 감독관 연결: ${admin.loginId} (${socket.id})`);

    // 퇴실 허용
    socket.on('proctor:allow-exit', (data: { examineeId: string; examSetId: string }) => {
      console.log(`[WS/proctor] 퇴실 허용: 응시자 ${data.examineeId}`);
      examNsp
        .to(`waiting:${data.examSetId}`)
        .emit('proctor:allow-exit', {
          examineeId: data.examineeId,
          approvedBy: admin.loginId,
        });
    });

    // 강제 종료
    socket.on('proctor:force-end', (data: { examSetId: string; reason?: string }) => {
      console.log(`[WS/proctor] 강제 종료: 시험세트 ${data.examSetId}`);
      examNsp
        .to(`waiting:${data.examSetId}`)
        .emit('proctor:force-end', {
          examSetId: data.examSetId,
          reason: data.reason ?? '감독관에 의해 시험이 강제 종료되었습니다',
          forcedBy: admin.loginId,
        });
    });

    socket.on('disconnect', () => {
      console.log(`[WS/proctor] 감독관 연결 해제: ${admin.loginId} (${socket.id})`);
    });
  });

  // 카운트다운 스케줄러 시작
  startCountdownScheduler(io);

  return io;
}

/**
 * 세션 업데이트 브로드캐스트 헬퍼
 * 특정 시험세트의 대기실에 세션 상태 변경을 전파합니다.
 */
export function broadcastSessionUpdate(
  io: SocketIOServer,
  examSetId: string,
  event: string,
  data: unknown,
): void {
  const examNsp = io.of('/exam');
  examNsp.to(`waiting:${examSetId}`).emit(event, data);
}
