import { AdminRole } from '@prisma/client';

// ─── Token Roles ────────────────────────────────────────────
export type TokenRole = 'examinee' | 'admin' | 'registration';

// ─── Token Payloads ─────────────────────────────────────────
export interface ExamineeTokenPayload {
  sub: string;          // examinee.id
  loginId: string;
  role: 'examinee';
}

export interface AdminTokenPayload {
  sub: string;          // adminUser.id
  loginId: string;
  role: AdminRole;
}

// ─── AppError ───────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ─── 접수자 토큰 ────────────────────────────────────────────
export interface RegistrationTokenPayload {
  sub: string;          // registrationUser.id
  email: string;
  role: 'registration';
}

// ─── Express 타입 확장 ──────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      examinee?: ExamineeTokenPayload;
      admin?: AdminTokenPayload;
      registrationUser?: RegistrationTokenPayload;
    }
  }
}
