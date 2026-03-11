import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { ExamineeTokenPayload, AdminTokenPayload, RegistrationTokenPayload } from '../types';

// ─── 응시자 토큰 ────────────────────────────────────────────
export function signExamineeToken(payload: Omit<ExamineeTokenPayload, 'role'>): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'] };
  return jwt.sign(
    { ...payload, role: 'examinee' } as ExamineeTokenPayload,
    env.JWT_SECRET,
    options,
  );
}

export function verifyExamineeToken(token: string): ExamineeTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as ExamineeTokenPayload;
}

// ─── 어드민 토큰 ────────────────────────────────────────────
export function signAdminToken(payload: Omit<AdminTokenPayload, 'role'> & { role: AdminTokenPayload['role'] }): string {
  const adminOptions: SignOptions = { expiresIn: env.ADMIN_JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'] };
  return jwt.sign(
    payload,
    env.ADMIN_JWT_SECRET,
    adminOptions,
  );
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminTokenPayload;
}

// ─── 접수자 토큰 ────────────────────────────────────────────
export function signRegistrationToken(payload: Omit<RegistrationTokenPayload, 'role'>): string {
  const options: SignOptions = { expiresIn: '24h' as unknown as SignOptions['expiresIn'] };
  return jwt.sign(
    { ...payload, role: 'registration' } as RegistrationTokenPayload,
    env.JWT_SECRET,
    options,
  );
}

export function verifyRegistrationToken(token: string): RegistrationTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as RegistrationTokenPayload;
  if (payload.role !== 'registration') {
    throw new Error('Invalid token type');
  }
  return payload;
}
