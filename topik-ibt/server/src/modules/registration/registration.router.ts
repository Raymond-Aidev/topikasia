import { Router } from 'express';
import { registrationAuth } from '../../middleware/registration-auth.middleware';
import { signup } from './handlers/signup';
import { verifyEmail } from './handlers/verifyEmail';
import { login } from './handlers/login';
import { listSchedules, getScheduleDetail } from './handlers/listSchedules';
import { applyRegistration } from './handlers/applyRegistration';
import { myRegistrations, myRegistrationDetail } from './handlers/myRegistrations';
import { cancelRegistration } from './handlers/cancelRegistration';
import { downloadTicket } from './handlers/downloadTicket';
import { checkEligibility } from './handlers/checkEligibility';
import { resendCode } from './handlers/resendCode';

const router = Router();

// ─── Public 라우트 ───────────────────────────────────────────
router.post('/signup', signup);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);
router.post('/login', login);
router.get('/schedules', listSchedules);
router.get('/schedules/:id', getScheduleDetail);

// ─── 접수자 인증 필요 라우트 ─────────────────────────────────
router.get('/check-eligibility', registrationAuth, checkEligibility);
router.post('/apply', registrationAuth, applyRegistration);
router.get('/my', registrationAuth, myRegistrations);
router.get('/my/:id/ticket', registrationAuth, downloadTicket);
router.get('/my/:id', registrationAuth, myRegistrationDetail);
router.delete('/my/:id', registrationAuth, cancelRegistration);

export default router;
