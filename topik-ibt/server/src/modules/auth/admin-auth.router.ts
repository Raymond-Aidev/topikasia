import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { adminAuth } from '../../middleware/auth.middleware';
import { adminLogin, adminMe } from './admin-auth.controller';

const router = Router();

const loginSchema = z.object({
  loginId: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
  twoFactorCode: z.string().optional(),
});

router.post('/login', validate({ body: loginSchema }), adminLogin);
router.get('/me', adminAuth, adminMe);

export default router;
