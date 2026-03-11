# TASK-09: 백엔드 서버 셋업 + 인증 시스템

> 연관 PRD: AUTH-01~06, ADMIN-09~10
> 연관 문서: [TASK-10 응시자 시험 API](./TASK-10_응시자시험API.md) · [TASK-11 어드민 API](./TASK-11_어드민API.md) · [TASK-12 문제은행·WebSocket·파일업로드](./TASK-12_문제은행_WebSocket_파일업로드.md)
> 우선순위: Phase 1 (모든 백엔드 작업의 기반)

---

## 목표

Express + TypeScript 백엔드 서버를 셋업하고,
응시자·어드민·출제자를 위한 JWT 기반 인증 및 RBAC 미들웨어를 구현한다.
이 TASK가 완료되어야 TASK-10 ~ 12 작업이 시작될 수 있다.

---

## 1. 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 런타임 | Node.js 20 LTS | 프론트엔드와 TypeScript 공유 |
| 프레임워크 | Express 4 + TypeScript | 안정성, 생태계 |
| ORM | Prisma | 타입 안전 쿼리, 마이그레이션 |
| 데이터베이스 | PostgreSQL 16 | 구조화 데이터, 트랜잭션 |
| 인증 | JWT (jsonwebtoken) | 역할별 토큰 분리 |
| 비밀번호 | bcrypt | 해시 저장 |
| 환경설정 | dotenv + zod | 환경변수 타입 검증 |
| 로깅 | winston | 구조화 로그 |
| 유효성 검사 | zod | 요청 파라미터 검증 |

---

## 2. 프로젝트 구조

```
server/
├── prisma/
│   ├── schema.prisma           ← DB 스키마 (전체 테이블 정의)
│   └── migrations/             ← 자동 생성 마이그레이션
├── src/
│   ├── app.ts                  ← Express 앱 초기화
│   ├── server.ts               ← HTTP + WebSocket 서버 시작
│   ├── config/
│   │   ├── env.ts              ← 환경변수 검증 (zod)
│   │   └── database.ts         ← Prisma 클라이언트 싱글톤
│   ├── middleware/
│   │   ├── auth.middleware.ts  ← JWT 검증
│   │   ├── rbac.middleware.ts  ← 역할 권한 검사
│   │   ├── validate.ts         ← zod 요청 검증
│   │   └── errorHandler.ts     ← 전역 에러 처리
│   ├── modules/
│   │   ├── auth/               ← 인증 (TASK-09)
│   │   ├── exam/               ← 시험 API (TASK-10)
│   │   ├── admin/              ← 어드민 API (TASK-11)
│   │   └── question-module/    ← 문제출제 API (TASK-12)
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts        ← 공통 타입 (Role, ApiResponse 등)
│   │   └── utils/
│   │       ├── jwt.ts          ← 토큰 발급·검증 유틸
│   │       └── password.ts     ← bcrypt 유틸
│   └── websocket/
│       └── index.ts            ← Socket.io 서버 (TASK-12)
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 3. 환경변수 (.env)

```env
# 서버
PORT=3000
NODE_ENV=development

# 데이터베이스
DATABASE_URL="postgresql://user:password@localhost:5432/topik_ibt"

# JWT — 응시자용
JWT_SECRET=your-exam-secret-key-here
JWT_EXPIRES_IN=8h

# JWT — 어드민용 (별도 시크릿)
ADMIN_JWT_SECRET=your-admin-secret-key-here
ADMIN_JWT_EXPIRES_IN=4h

# 파일 업로드 (AWS S3)
AWS_REGION=ap-northeast-2
AWS_BUCKET_NAME=topik-ibt-media
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# 문제은행 API (향후 제공)
QUESTION_BANK_API_URL=http://localhost:4000/api
QUESTION_BANK_API_KEY=mock-key
```

---

## 4. Prisma 스키마

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── 어드민 계정 ──────────────────────────────────────────────
model AdminUser {
  id           String   @id @default(cuid())
  loginId      String   @unique
  passwordHash String
  name         String
  role         AdminRole
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdExaminees Examinee[]
  uploadedExamSets ExamSet[]
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  PROCTOR
  QUESTION_AUTHOR
}

// ─── 응시자 ───────────────────────────────────────────────────
model Examinee {
  id                 String          @id @default(cuid())
  loginId            String          @unique
  passwordHash       String
  name               String
  registrationNumber String          @unique
  seatNumber         Int?
  photoUrl           String?
  institutionName    String?
  examRoomName       String?
  status             ExamineeStatus  @default(ACTIVE)
  loginFailCount     Int             @default(0)
  assignedExamSetId  String?

  assignedExamSet    ExamSet?        @relation(fields: [assignedExamSetId], references: [id])
  createdBy          AdminUser       @relation(fields: [createdById], references: [id])
  createdById        String
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  examSessions       ExamSession[]
}

enum ExamineeStatus {
  ACTIVE
  INACTIVE
  LOCKED
}

// ─── 시험세트 ─────────────────────────────────────────────────
model ExamSet {
  id              String        @id @default(cuid())
  examSetNumber   String        @unique
  name            String
  examType        ExamType
  description     String?
  status          ExamSetStatus @default(DRAFT)
  sectionsJson      Json          // { LISTENING: { bankIds, durationMinutes }, ... }
  snapshotJson      Json?         // IBT 업로드 시 문제은행 스냅샷
  scheduledStartAt  DateTime?     // 동시시작 예정 일시 (null이면 감독관 수동 시작)
  uploadedAt        DateTime?
  uploadedBy      AdminUser?    @relation(fields: [uploadedById], references: [id])
  uploadedById    String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  assignedExaminees Examinee[]
  examSessions      ExamSession[]
}

enum ExamType {
  TOPIK_I
  TOPIK_II
}

enum ExamSetStatus {
  DRAFT
  UPLOADED
  ACTIVE
  ARCHIVED
}

// ─── 응시 세션 ────────────────────────────────────────────────
model ExamSession {
  id                String        @id @default(cuid())
  examineeId        String
  examSetId         String
  status            SessionStatus @default(IN_PROGRESS)
  sectionProgressJson Json        // { LISTENING: { startedAt, submittedAt, isAutoSubmitted }, ... }
  startedAt         DateTime      @default(now())
  completedAt       DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  examinee          Examinee      @relation(fields: [examineeId], references: [id])
  examSet           ExamSet       @relation(fields: [examSetId], references: [id])
  answers           Answer[]
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

// ─── 답안 ─────────────────────────────────────────────────────
model Answer {
  id              String      @id @default(cuid())
  sessionId       String
  questionBankId  String      // 문제은행 bankId
  section         String      // LISTENING | WRITING | READING
  questionIndex   Int         // 세트 내 문항 순서
  answerJson      Json        // 유형별 답안 (selectedOptions, textInput, orderedItems 등)
  savedAt         DateTime    @default(now())
  submittedAt     DateTime?
  isAutoSubmitted Boolean     @default(false)

  session         ExamSession @relation(fields: [sessionId], references: [id])

  @@unique([sessionId, questionBankId])
}
```

---

## 5. 환경변수 검증 (config/env.ts)

```typescript
// src/config/env.ts
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("8h"),
  ADMIN_JWT_SECRET: z.string().min(32),
  ADMIN_JWT_EXPIRES_IN: z.string().default("4h"),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  QUESTION_BANK_API_URL: z.string().default("http://localhost:4000/api"),
  QUESTION_BANK_API_KEY: z.string().default("mock-key"),
});

export const env = envSchema.parse(process.env);
```

---

## 6. JWT 유틸 (shared/utils/jwt.ts)

```typescript
// src/shared/utils/jwt.ts
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export type TokenRole = "EXAMINEE" | "ADMIN" | "SUPER_ADMIN" | "PROCTOR" | "QUESTION_AUTHOR";

export interface ExamineeTokenPayload {
  sub: string;        // examineeId
  loginId: string;
  type: "EXAMINEE";
}

export interface AdminTokenPayload {
  sub: string;        // adminId
  loginId: string;
  role: Exclude<TokenRole, "EXAMINEE">;
  type: "ADMIN";
}

// 응시자 토큰 발급
export function signExamineeToken(payload: Omit<ExamineeTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "EXAMINEE" }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// 어드민 토큰 발급
export function signAdminToken(payload: Omit<AdminTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "ADMIN" }, env.ADMIN_JWT_SECRET, {
    expiresIn: env.ADMIN_JWT_EXPIRES_IN,
  });
}

// 응시자 토큰 검증
export function verifyExamineeToken(token: string): ExamineeTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as ExamineeTokenPayload;
}

// 어드민 토큰 검증
export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminTokenPayload;
}
```

---

## 7. 인증 미들웨어 (middleware/auth.middleware.ts)

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyExamineeToken, verifyAdminToken } from "../shared/utils/jwt";

// 응시자 인증
export function examAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "인증 토큰이 없습니다." });
  try {
    req.examinee = verifyExamineeToken(token);
    next();
  } catch {
    res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
}

// 어드민 인증
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "인증 토큰이 없습니다." });
  try {
    req.admin = verifyAdminToken(token);
    next();
  } catch {
    res.status(401).json({ error: "유효하지 않은 어드민 토큰입니다." });
  }
}
```

---

## 8. RBAC 미들웨어 (middleware/rbac.middleware.ts)

```typescript
// src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AdminRole } from "@prisma/client";

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const adminRole = req.admin?.role;
    if (!adminRole || !roles.includes(adminRole as AdminRole)) {
      return res.status(403).json({ error: "권한이 없습니다." });
    }
    next();
  };
}

// 사용 예시:
// router.post("/exam-sets/:id/upload", adminAuth, requireRole("ADMIN","SUPER_ADMIN"), uploadHandler)
// router.post("/questions/import",     adminAuth, requireRole("QUESTION_AUTHOR","SUPER_ADMIN"), importHandler)
```

---

## 9. 응시자 인증 API (modules/auth/)

```typescript
// POST /api/exam-auth/login (응시자 로그인)
// src/modules/auth/exam-auth.controller.ts

export async function examLogin(req: Request, res: Response) {
  const { loginId, password } = req.body;

  const examinee = await prisma.examinee.findUnique({ where: { loginId } });

  // 계정 없음 또는 비활성화
  if (!examinee || examinee.status === "INACTIVE") {
    return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  // 계정 잠금 확인
  if (examinee.status === "LOCKED") {
    return res.status(403).json({ error: "계정이 잠금 상태입니다. 관리자에게 문의하세요." });
  }

  // 비밀번호 검증
  const isValid = await bcrypt.compare(password, examinee.passwordHash);
  if (!isValid) {
    // 실패 횟수 증가 + 5회 이상 시 잠금
    const failCount = examinee.loginFailCount + 1;
    const newStatus = failCount >= 5 ? "LOCKED" : "ACTIVE";
    await prisma.examinee.update({
      where: { id: examinee.id },
      data: { loginFailCount: failCount, status: newStatus },
    });
    return res.status(401).json({
      error: `비밀번호가 올바르지 않습니다. (${failCount}/5)`,
      locked: newStatus === "LOCKED",
    });
  }

  // 로그인 성공: 실패 횟수 초기화
  await prisma.examinee.update({
    where: { id: examinee.id },
    data: { loginFailCount: 0 },
  });

  const token = signExamineeToken({ sub: examinee.id, loginId: examinee.loginId });

  res.json({
    token,
    examinee: {
      id: examinee.id,
      loginId: examinee.loginId,
      name: examinee.name,
      registrationNumber: examinee.registrationNumber,
      seatNumber: examinee.seatNumber,
      photoUrl: examinee.photoUrl,
    },
  });
}
```

```typescript
// POST /api/admin-auth/login (어드민 로그인)
export async function adminLogin(req: Request, res: Response) {
  const { loginId, password } = req.body;

  const admin = await prisma.adminUser.findUnique({ where: { loginId } });
  if (!admin || !admin.isActive) {
    return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
  }

  const token = signAdminToken({ sub: admin.id, loginId: admin.loginId, role: admin.role });
  res.json({ token, admin: { id: admin.id, name: admin.name, role: admin.role } });
}
```

---

## 10. 전역 에러 핸들러 (middleware/errorHandler.ts)

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? "서버 오류가 발생했습니다.";

  console.error(`[${req.method}] ${req.path} — ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
```

---

## 11. 서버 진입점 (app.ts / server.ts)

```typescript
// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import examAuthRouter   from "./modules/auth/exam-auth.router";
import adminAuthRouter  from "./modules/auth/admin-auth.router";
import examRouter       from "./modules/exam/exam.router";
import adminRouter      from "./modules/admin/admin.router";
import questionRouter   from "./modules/question-module/question.router";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 라우터
app.use("/api/exam-auth",        examAuthRouter);   // 응시자 인증
app.use("/api/admin-auth",       adminAuthRouter);  // 어드민 인증
app.use("/api/exam",             examRouter);       // 응시자 시험 API (TASK-10)
app.use("/api/admin",            adminRouter);      // 어드민 API     (TASK-11)
app.use("/api/questions",        questionRouter);   // 문제출제 모듈  (TASK-12)

app.use(errorHandler);
export default app;
```

```typescript
// src/server.ts
import http from "http";
import app from "./app";
import { initWebSocket } from "./websocket";
import { env } from "./config/env";

const server = http.createServer(app);
initWebSocket(server);   // Socket.io 초기화 (TASK-12)

server.listen(env.PORT, () => {
  console.log(`서버 실행: http://localhost:${env.PORT}`);
});
```

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 모든 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T1-01 | 로그인 failCount 원자적 증가 (A-01 + I-01)

**대상**: `src/modules/auth/examAuth.handler.ts` — `examLogin` 함수

```typescript
// ❌ 기존 코드 — 경쟁 조건 발생
await prisma.examinee.update({
  data: { loginFailCount: failCount + 1 }
});

// ✅ 수정 — Prisma 원자적 증가 (increment)
const updated = await prisma.examinee.update({
  where: { id: examinee.id },
  data: { loginFailCount: { increment: 1 } },
  select: { loginFailCount: true }
});
// 잠금 판단은 업데이트 후 반환값으로 결정
if (updated.loginFailCount >= MAX_FAIL_COUNT) {
  await prisma.examinee.update({
    where: { id: examinee.id },
    data: { status: "LOCKED" }
  });
}
```

---

### T1-04 | Prisma 스키마 CASCADE 동작 명시 (C-02)

**대상**: `prisma/schema.prisma` — 관계 정의 전체

```prisma
// ✅ onDelete 동작 명시 (기본값 RESTRICT → 의도한 동작으로 변경)

model Examinee {
  assignedExamSet ExamSet? @relation(
    fields: [assignedExamSetId], references: [id],
    onDelete: SetNull  // ExamSet 삭제 시 배정 해제 (NULL로)
  )
  examSessions ExamSession[]
}

model ExamSession {
  examinee Examinee @relation(
    fields: [examineeId], references: [id],
    onDelete: Cascade  // Examinee 삭제 시 세션도 함께 삭제
  )
  answers Answer[]
}

model Answer {
  session ExamSession @relation(
    fields: [sessionId], references: [id],
    onDelete: Cascade  // ExamSession 삭제 시 답안도 함께 삭제
  )
}
```

---

### T1-02 (마이그레이션) | ExamSession Partial Unique Index (A-04 + I-02 + C-01)

**대상**: `prisma/migrations/` — 신규 마이그레이션 파일 추가

```sql
-- 마이그레이션: add_one_active_session_constraint.sql
-- 응시자 1인 IN_PROGRESS 세션 1개 제한 (DB 레벨 보장)
CREATE UNIQUE INDEX uq_one_active_session
  ON "ExamSession" ("examineeId")
  WHERE status = 'IN_PROGRESS';
```

> ⚠️ Prisma schema.prisma에는 partial unique index를 직접 표현할 수 없으므로
> `prisma/migrations/` 하위에 수동 마이그레이션 SQL을 추가하고
> `prisma migrate dev` 실행 후 반드시 적용 확인

---

### T1-06 (마이그레이션) | 시험세트 번호 시퀀스 생성 (A-06 + I-03)

**대상**: `prisma/migrations/` — 신규 마이그레이션 파일 추가

```sql
-- 마이그레이션: add_exam_set_number_sequence.sql
-- 동시 생성 시 번호 중복 방지용 PostgreSQL Sequence
CREATE SEQUENCE exam_set_number_seq START 1;
```

---

### T2-04 (마이그레이션) | assignedExamSetId ACTIVE 전용 CHECK CONSTRAINT (C-04)

**대상**: `prisma/migrations/` — 신규 마이그레이션 파일 추가

```sql
-- 마이그레이션: add_active_exam_set_constraint.sql
-- ACTIVE 상태 세트만 응시자에게 배정 가능 (DB 레벨 강제)
ALTER TABLE "Examinee"
  ADD CONSTRAINT chk_active_exam_set
  CHECK (
    "assignedExamSetId" IS NULL OR
    EXISTS (
      SELECT 1 FROM "ExamSet"
      WHERE id = "assignedExamSetId"
        AND status = 'ACTIVE'
    )
  );
```

## 12. 완료 조건 (Acceptance Criteria)

- [ ] PostgreSQL + Prisma 연결 및 마이그레이션 정상 실행
- [ ] 환경변수 누락 시 서버 시작 단계에서 오류 발생 (zod 검증)
- [ ] `POST /api/exam-auth/login`: 응시자 로그인 성공 → JWT 반환
- [ ] `POST /api/admin-auth/login`: 어드민 로그인 성공 → JWT 반환
- [ ] 로그인 실패 5회 → 계정 LOCKED 상태 전환
- [ ] `examAuth` 미들웨어: 유효 토큰 통과, 만료/위조 토큰 401 반환
- [ ] `adminAuth` 미들웨어: 응시자 토큰으로 어드민 API 접근 시 401
- [ ] `requireRole("ADMIN")` 미들웨어: PROCTOR 역할로 접근 시 403
- [ ] 전역 에러 핸들러: 처리되지 않은 오류도 JSON 응답으로 반환

---

## 13. 패키지 설치

```bash
npm init -y
npm install express cors helmet bcrypt jsonwebtoken dotenv zod winston
npm install @prisma/client
npm install -D typescript ts-node nodemon @types/express @types/node
npm install -D @types/bcrypt @types/jsonwebtoken prisma

# Prisma 초기화
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
```


---

## SYNC 추가: scheduledStartAt 필드 — 동시시작 지원

### Prisma 마이그레이션 설명

`ExamSet.scheduledStartAt` 필드가 추가되어 시험 예정 일시를 저장한다.

```sql
-- 마이그레이션 SQL (Prisma가 자동 생성)
ALTER TABLE "ExamSet"
ADD COLUMN "scheduledStartAt" TIMESTAMP(3);
-- NULL 허용: 미설정 시 감독관 수동 시작 방식 유지
```

### 환경변수 추가 (.env)

```env
# 동시시작 설정
EXAM_COUNTDOWN_SECONDS=10       # 카운트다운 시작까지 남은 초 (기본: 10)
EXAM_LATE_GRACE_SECONDS=0       # scheduledStartAt 이후 진입 허용 유예 시간 (기본: 0초, 즉 즉시 차단)
```

### env.ts 업데이트

```typescript
// src/config/env.ts — 추가 항목
const envSchema = z.object({
  // ... 기존 항목 ...
  EXAM_COUNTDOWN_SECONDS: z.string().default("10"),
  EXAM_LATE_GRACE_SECONDS: z.string().default("0"),
  // LLM (TASK-17)
  LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),
  LLM_MODEL: z.string().default("gpt-4o"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // 프론트엔드 URL
  FRONTEND_URL: z.string().default("http://localhost:5173"),
});
```

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] Prisma 스키마 정의 (AdminUser, Examinee, ExamSet, ExamSession, Answer, AuditLog) — `server/prisma/schema.prisma`
- [x] 환경변수 Zod 검증 (PORT, DATABASE_URL, JWT_SECRET 32자+, AWS optional, LLM, FRONTEND_URL) — `server/src/config/env.ts`
- [x] Prisma 클라이언트 싱글톤 + dev 로깅 — `server/src/config/database.ts`
- [x] JWT 발급·검증 유틸 (Examinee/Admin 분리) — `server/src/shared/utils/jwt.ts`
- [x] bcrypt 12 rounds 해시 유틸 — `server/src/shared/utils/password.ts`
- [x] 응시자·어드민 인증 미들웨어 (Bearer 토큰) — `server/src/middleware/auth.middleware.ts`
- [x] RBAC 역할 권한 미들웨어 — `server/src/middleware/rbac.middleware.ts`
- [x] Zod 요청 검증 미들웨어 (body/params/query) — `server/src/middleware/validate.ts`
- [x] 전역 에러 핸들러 (AppError, P2002→409, 500 fallback) — `server/src/middleware/errorHandler.ts`
- [x] 응시자 로그인 (T1-01 atomic loginFailCount increment, 5회 잠금) — `server/src/modules/auth/exam-auth.controller.ts`
- [x] 어드민 로그인·내 정보 조회 — `server/src/modules/auth/admin-auth.controller.ts`
- [x] Express 앱 초기화 (helmet, cors, morgan, 라우터 마운트, 404, errorHandler) — `server/src/app.ts`
- [x] HTTP + WebSocket 서버 + autoSubmit job (60초) + graceful shutdown — `server/src/server.ts`
- [x] 공통 타입 정의 (Role, ApiResponse 등) — `server/src/shared/types/index.ts`
- [x] DB 마이그레이션: 1인 1 IN_PROGRESS 세션 제한 — `server/prisma/migrations/manual/001_add_one_active_session_constraint.sql`
- [x] DB 마이그레이션: 시험세트 번호 시퀀스 — `server/prisma/migrations/manual/002_add_exam_set_number_sequence.sql`
- [x] DB 마이그레이션: ACTIVE 세트만 배정 제약 — `server/prisma/migrations/manual/003_add_active_exam_set_constraint.sql`

### 미완료 항목 (Phase 2)
- [ ] T2-04 CHECK CONSTRAINT 실 운영 환경 적용 테스트
- [ ] Redis 기반 세션 관리 (현재 JWT stateless)
- [ ] 로그인 시도 Rate Limiting

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `src/config/env.ts` | `server/src/config/env.ts` | ✅ |
| `src/config/database.ts` | `server/src/config/database.ts` | ✅ |
| `src/middleware/auth.middleware.ts` | `server/src/middleware/auth.middleware.ts` | ✅ |
| `src/middleware/rbac.middleware.ts` | `server/src/middleware/rbac.middleware.ts` | ✅ |
| `src/middleware/validate.ts` | `server/src/middleware/validate.ts` | ✅ |
| `src/middleware/errorHandler.ts` | `server/src/middleware/errorHandler.ts` | ✅ |
| `src/shared/utils/jwt.ts` | `server/src/shared/utils/jwt.ts` | ✅ |
| `src/shared/utils/password.ts` | `server/src/shared/utils/password.ts` | ✅ |
| `src/shared/types/index.ts` | `server/src/shared/types/index.ts` | ✅ |
| `src/modules/auth/exam-auth.controller.ts` | `server/src/modules/auth/exam-auth.controller.ts` | ✅ |
| `src/modules/auth/admin-auth.controller.ts` | `server/src/modules/auth/admin-auth.controller.ts` | ✅ |
| `src/modules/auth/exam-auth.router.ts` (문서 미명시) | `server/src/modules/auth/exam-auth.router.ts` | ✅ |
| `src/modules/auth/admin-auth.router.ts` (문서 미명시) | `server/src/modules/auth/admin-auth.router.ts` | ✅ |
| `src/app.ts` | `server/src/app.ts` | ✅ |
| `src/server.ts` | `server/src/server.ts` | ✅ |
| `prisma/schema.prisma` | `server/prisma/schema.prisma` | ✅ |
| `prisma/migrations/` (수동 SQL) | `server/prisma/migrations/manual/` (3건) | ✅ |

### ACID 준수 현황
- [x] T1-01: 로그인 failCount 원자적 증가 (Prisma increment) — `exam-auth.controller.ts`
- [x] T1-04: Prisma 스키마 CASCADE/SetNull onDelete 명시 — `schema.prisma`
- [x] T1-02: ExamSession Partial Unique Index SQL 생성 — `001_add_one_active_session_constraint.sql`
- [x] T1-06: 시험세트 번호 시퀀스 SQL 생성 — `002_add_exam_set_number_sequence.sql`
- [ ] T2-04: assignedExamSetId ACTIVE CHECK CONSTRAINT — SQL 생성 완료, 운영 적용 테스트 필요 (Phase 2)

### 비고
- 문서에는 auth 라우터 파일이 명시되지 않았으나, `exam-auth.router.ts`와 `admin-auth.router.ts`가 구현되어 있음
- `server.ts`에 autoSubmit job과 graceful shutdown이 문서 스펙 이상으로 추가 구현됨
- env.ts에 LLM 관련 환경변수(LLM_PROVIDER, LLM_MODEL 등)가 문서 SYNC 섹션 반영으로 추가됨
