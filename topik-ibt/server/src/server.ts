import http from 'http';
import app from './app';
import { env } from './config/env';
import { initWebSocket } from './websocket';
import { autoSubmitExpiredSections } from './jobs/autoSubmit.job';

const server = http.createServer(app);

// WebSocket 초기화
const io = initWebSocket(server);

// 자동 제출 job (60초 간격)
const autoSubmitInterval = setInterval(autoSubmitExpiredSections, 60_000);

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
