import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routers
import examAuthRouter from './modules/auth/exam-auth.router';
import adminAuthRouter from './modules/auth/admin-auth.router';
import examRouter from './modules/exam/exam.router';
import adminRouter from './modules/admin/admin.router';
import questionRouter from './modules/question-module/question.router';
import registrationRouter from './modules/registration/registration.router';

const app = express();

// ─── 글로벌 미들웨어 ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    env.FRONTEND_URL,
    /\.railway\.app$/,
    'http://localhost:5173',
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── 헬스체크 ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 프로덕션 정적 파일 서빙 ─────────────────────────────────
if (process.env.NODE_ENV === 'production' && process.env.SERVE_CLIENT === 'true') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
}

// ─── 라우터 마운트 ───────────────────────────────────────────
app.use('/api/exam-auth', examAuthRouter);
app.use('/api/admin-auth', adminAuthRouter);
app.use('/api/exam', examRouter);
app.use('/api/admin', adminRouter);
app.use('/api/questions', questionRouter);
app.use('/api/registration', registrationRouter);

// ─── SPA 폴백 (API 라우트 이후) ──────────────────────────────
if (process.env.NODE_ENV === 'production' && process.env.SERVE_CLIENT === 'true') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── 404 핸들러 ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: '요청한 리소스를 찾을 수 없습니다' });
});

// ─── 글로벌 에러 핸들러 ──────────────────────────────────────
app.use(errorHandler);

export default app;
