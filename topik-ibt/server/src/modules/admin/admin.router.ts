import { Router } from 'express';
import multer from 'multer';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

// Handlers
import { listExaminees } from './handlers/listExaminees';
import { createExaminee } from './handlers/createExaminee';
import { getExaminee } from './handlers/getExaminee';
import { updateExaminee } from './handlers/updateExaminee';
import { resetPassword } from './handlers/resetPassword';
import { changeExamSet } from './handlers/changeExamSet';
import { changeStatus } from './handlers/changeStatus';
import { listExamSets, listAssignableExamSets } from './handlers/listExamSets';
import { getExamSet } from './handlers/getExamSet';
import { getDashboardSummary } from './handlers/getDashboardSummary';
import { listExamSessions } from './handlers/listExamSessions';
import { getExamSessionDetail } from './handlers/getExamSessionDetail';
import { exportExamSessions } from './handlers/exportExamSessions';
import { listRegistrations } from './handlers/listRegistrations';
import { approveRegistration } from './handlers/approveRegistration';
import { rejectRegistration } from './handlers/rejectRegistration';
import { batchApproveRegistrations } from './handlers/batchApproveRegistrations';
import { getRealtimeMonitor } from './handlers/getRealtimeMonitor';
import { bulkImportExaminees } from './handlers/bulkImportExaminees';
import { runAutoScore } from './handlers/runAutoScore';
import { listScores } from './handlers/listScores';
import { getScoreDetail } from './handlers/getScoreDetail';
import { manualGrade } from './handlers/manualGrade';
import { publishScores } from './handlers/publishScores';
import { getLlmSettings, testLlmExplanation } from './handlers/getLlmSettings';
import { getQuestionTypes } from './handlers/getQuestionTypes';
import { updateQuestionTypes } from './handlers/updateQuestionTypes';

const router = Router();

// multer 설정 (메모리 스토리지 - S3 업로드용)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다'));
    }
  },
});

// 모든 어드민 라우트에 인증 적용
router.use(adminAuth);

// ─── 대시보드 ─────────────────────────────────────────────────
router.get(
  '/dashboard/summary',
  requireRole('SUPER_ADMIN', 'ADMIN', 'PROCTOR'),
  getDashboardSummary,
);

// ─── 응시자 관리 ──────────────────────────────────────────────
router.get(
  '/examinees',
  requireRole('SUPER_ADMIN', 'ADMIN', 'PROCTOR'),
  listExaminees,
);

router.post(
  '/examinees',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  upload.single('photo'),
  createExaminee,
);

router.get(
  '/examinees/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'PROCTOR'),
  getExaminee,
);

router.put(
  '/examinees/:id',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  updateExaminee,
);

router.post(
  '/examinees/:id/reset-password',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  resetPassword,
);

router.put(
  '/examinees/:id/exam-set',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  changeExamSet,
);

router.put(
  '/examinees/:id/status',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  changeStatus,
);

// ─── 실시간 모니터링 ───────────────────────────────────────────
router.get(
  '/monitor/realtime',
  requireRole('SUPER_ADMIN', 'ADMIN', 'PROCTOR'),
  getRealtimeMonitor,
);

// ─── 응시자 일괄 등록 ─────────────────────────────────────────
router.post(
  '/examinees/bulk-import',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  upload.single('file'),
  bulkImportExaminees,
);

// ─── 시험세트 관리 ────────────────────────────────────────────
router.get(
  '/exam-sets',
  requireRole('SUPER_ADMIN', 'ADMIN', 'PROCTOR'),
  listExamSets,
);

router.get(
  '/exam-sets/assignable',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  listAssignableExamSets,
);

router.get(
  '/exam-sets/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'PROCTOR'),
  getExamSet,
);

// ─── 시험 세션 관리 ───────────────────────────────────────────
// NOTE: /export must come before /:id to avoid route conflict
router.get(
  '/exam-sessions/export',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  exportExamSessions,
);

router.get(
  '/exam-sessions',
  requireRole('SUPER_ADMIN', 'ADMIN', 'PROCTOR'),
  listExamSessions,
);

router.get(
  '/exam-sessions/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'PROCTOR'),
  getExamSessionDetail,
);

// ─── 접수 관리 ────────────────────────────────────────────────
// NOTE: /batch-approve must come before /:id to avoid route conflict
router.post(
  '/registrations/batch-approve',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  batchApproveRegistrations,
);

router.get(
  '/registrations',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  listRegistrations,
);

router.post(
  '/registrations/:id/approve',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  approveRegistration,
);

router.post(
  '/registrations/:id/reject',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  rejectRegistration,
);

// ─── 성적 관리 ─────────────────────────────────────────────
router.post(
  '/scores/auto-grade',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  runAutoScore,
);

router.post(
  '/scores/publish',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  publishScores,
);

router.get(
  '/scores',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  listScores,
);

router.get(
  '/scores/:id',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  getScoreDetail,
);

router.patch(
  '/scores/:id/manual-grade',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  manualGrade,
);

// ─── LLM 설정 ─────────────────────────────────────────────
router.get(
  '/llm-settings',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  getLlmSettings,
);

router.post(
  '/llm-settings/test',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  testLlmExplanation,
);

// ─── 문제 유형 설정 ──────────────────────────────────────────
router.get(
  '/question-types',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  getQuestionTypes,
);

router.put(
  '/question-types',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  updateQuestionTypes,
);

export default router;
