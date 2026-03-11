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

const router = Router();

// multer 설정 (메모리 스토리지 - S3 업로드용)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 이미지 형식입니다 (JPEG, PNG, WebP만 허용)'));
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

export default router;
