import { Router } from 'express';
import { lmsAuth } from '../../middleware/lms-auth.middleware';
import { getExamHistory } from './handlers/getExamHistory';
import { getQuestionReview } from './handlers/getQuestionReview';
import { generateExplanation } from './handlers/generateExplanation';
import { getAnalysis } from './handlers/getAnalysis';

const router = Router();

// LMS는 응시자 또는 접수자 인증 허용
router.use(lmsAuth);

// 시험 이력 목록
router.get('/history', getExamHistory);

// 문제 복습 (답안 + 정답 + 해설)
router.get('/sessions/:sessionId/review', getQuestionReview);

// LLM 해설 생성
router.post('/sessions/:sessionId/explain/:questionBankId', generateExplanation);

// 강점/약점 분석
router.get('/sessions/:sessionId/analysis', getAnalysis);

export default router;
