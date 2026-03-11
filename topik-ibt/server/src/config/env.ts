import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL은 필수입니다'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET은 최소 32자 이상이어야 합니다'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  ADMIN_JWT_SECRET: z.string().min(32, 'ADMIN_JWT_SECRET은 최소 32자 이상이어야 합니다'),
  ADMIN_JWT_EXPIRES_IN: z.string().default('4h'),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  QUESTION_BANK_API_URL: z.string().default('http://localhost:4000/api'),
  QUESTION_BANK_API_KEY: z.string().default('mock-key'),
  EXAM_COUNTDOWN_SECONDS: z.coerce.number().default(10),
  EXAM_LATE_GRACE_SECONDS: z.coerce.number().default(0),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('환경변수 검증 실패:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
