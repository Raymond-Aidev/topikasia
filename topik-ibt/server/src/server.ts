// === 최초 디버깅: 모든 import 전에 환경변수 확인 ===
console.log('[DEBUG] DATABASE_URL length:', process.env.DATABASE_URL?.length ?? 'undefined');
console.log('[DEBUG] DATABASE_URL first 30:', process.env.DATABASE_URL?.substring(0, 30) ?? 'EMPTY');
console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('[DEBUG] All DB vars:', Object.keys(process.env).filter(k => /database|postgres|pg/i.test(k)));

import http from 'http';
import app from './app';
import { env } from './config/env';
import { initWebSocket } from './websocket';
import { autoSubmitExpiredSections } from './jobs/autoSubmit.job';

const server = http.createServer(app);

// WebSocket 초기화
const io = initWebSocket(server);

// 자동 제출 job (60초 간격) - DB 에러 시에도 서버 유지
const autoSubmitInterval = setInterval(async () => {
  try {
    await autoSubmitExpiredSections();
  } catch (err) {
    console.error('[AutoSubmit] job 에러:', err);
  }
}, 60_000);

server.listen(env.PORT, () => {
  console.log(`[Server] ${env.NODE_ENV} 모드로 포트 ${env.PORT}에서 실행중`);
  console.log(`[Server] 프론트엔드 URL: ${env.FRONTEND_URL}`);
  console.log(`[Server] 자동 제출 job 시작 (60초 간격)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM 수신, 서버를 종료합니다...');
  clearInterval(autoSubmitInterval);
  io.close();
  server.close(() => {
    console.log('[Server] 서버가 정상적으로 종료되었습니다');
    process.exit(0);
  });
});

export { server, io };
