import { Router } from 'express';
import { adminAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { getQuestionsByType } from './handlers/getQuestionsByType';
import { getQuestionDetail } from './handlers/getQuestionDetail';
import { createExamSet } from './handlers/createExamSet';
import { updateExamSet } from './handlers/updateExamSet';
import { listExamSets } from './handlers/listExamSets';
import { getExamSetDetail } from './handlers/getExamSetDetail';
import { uploadExamSet } from './handlers/uploadExamSet';
import { deleteExamSet } from './handlers/deleteExamSet';
import { uploadMiddleware, uploadMedia } from './handlers/uploadMedia';
import { updateModelAnswer } from './handlers/updateModelAnswer';

const router = Router();

// ─── 문제은행 API ────────────────────────────────────────────
// 관리자 + 출제자 이상 접근 가능
router.get(
  '/question-bank/questions',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'QUESTION_AUTHOR'),
  getQuestionsByType,
);

router.get(
  '/question-bank/questions/:bankId',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'QUESTION_AUTHOR'),
  getQuestionDetail,
);

// ─── 시험세트 CRUD ───────────────────────────────────────────
router.post(
  '/question-module/exam-sets',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'QUESTION_AUTHOR'),
  createExamSet,
);

router.put(
  '/question-module/exam-sets/:id',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'QUESTION_AUTHOR'),
  updateExamSet,
);

router.get(
  '/question-module/exam-sets',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'QUESTION_AUTHOR', 'PROCTOR'),
  listExamSets,
);

router.get(
  '/question-module/exam-sets/:id',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'QUESTION_AUTHOR', 'PROCTOR'),
  getExamSetDetail,
);

// ─── 시험세트 삭제 (DRAFT / ARCHIVED만 가능) ────────────────
router.delete(
  '/question-module/exam-sets/:id',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  deleteExamSet,
);

// ─── 모범답안 / 채점기준 업데이트 ──────────────────────────────
router.put(
  '/question-module/exam-sets/:id/model-answer',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'QUESTION_AUTHOR'),
  updateModelAnswer,
);

// ─── 시험세트 업로드 (DRAFT → UPLOADED) ─────────────────────
router.post(
  '/question-module/exam-sets/:id/upload',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  uploadExamSet,
);

// ─── 미디어 업로드 ───────────────────────────────────────────
router.post(
  '/media/upload',
  adminAuth,
  requireRole('SUPER_ADMIN', 'ADMIN', 'QUESTION_AUTHOR'),
  uploadMiddleware,
  uploadMedia,
);

export default router;
