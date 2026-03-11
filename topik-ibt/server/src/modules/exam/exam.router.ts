import { Router } from 'express';
import { z } from 'zod';
import { examAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { getAssignedSet } from './handlers/getAssignedSet';
import { createExamSession } from './handlers/createExamSession';
import { getCurrentSession } from './handlers/getCurrentSession';
import { recordSectionStart } from './handlers/recordSectionStart';
import { saveAnswers } from './handlers/saveAnswers';
import { submitSection } from './handlers/submitSection';
import { completeSession } from './handlers/completeSession';

const router = Router();

// 모든 시험 API는 응시자 인증 필요
router.use(examAuth);

// 배정된 시험세트 조회
router.get('/assigned-set', getAssignedSet);

// 세션 생성
router.post('/sessions', createExamSession);

// 현재 세션 조회
router.get('/sessions/current', getCurrentSession);

// 섹션 시작
const sectionNameSchema = z.object({
  sectionName: z.string().min(1, '섹션명을 입력해주세요'),
});

router.post(
  '/sessions/:sessionId/section-start',
  validate({ body: sectionNameSchema }),
  recordSectionStart,
);

// 답안 저장
const saveAnswersSchema = z.object({
  answers: z.array(z.object({
    questionBankId: z.string().min(1),
    section: z.string().min(1),
    questionIndex: z.number().int().min(0),
    answerJson: z.any(),
  })).min(1, '저장할 답안이 필요합니다'),
});

router.put(
  '/sessions/:sessionId/answers',
  validate({ body: saveAnswersSchema }),
  saveAnswers,
);

// 섹션 제출
router.post(
  '/sessions/:sessionId/submit-section',
  validate({ body: sectionNameSchema }),
  submitSection,
);

// 세션 완료
router.post('/sessions/:sessionId/complete', completeSession);

export default router;
