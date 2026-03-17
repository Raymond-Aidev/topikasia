import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { examAuth } from '../../middleware/auth.middleware';
import { examLogin, examMe } from './exam-auth.controller';

const router = Router();

const loginSchema = z.object({
  loginId: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().optional(),
});

router.post('/login', validate({ body: loginSchema }), examLogin);
router.get('/me', examAuth, examMe);

export default router;
