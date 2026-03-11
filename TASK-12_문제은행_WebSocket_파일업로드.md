# TASK-12: 문제은행 연동 + WebSocket + 파일 업로드

> 연관 PRD: QUESTION-01~17, UI-03~04, MONITOR-05
> 연관 문서: [TASK-09 백엔드 서버셋업·인증](./TASK-09_백엔드_서버셋업_인증.md) · [TASK-08 문제 출제 모듈 프론트엔드](./TASK-08_문제출제모듈.md) · [TASK-11 어드민 API](./TASK-11_어드민API.md)
> 우선순위: Phase 1 (문제출제·파일업로드) / Phase 2 (WebSocket 실시간)
> 선행 조건: TASK-09 완료 후 시작

---

## 목표

1. **문제 출제 모듈 API**: 문제은행 연동(Mock→실제 교체 가능), 시험세트 구성·IBT 업로드
2. **파일 업로드**: 사진·오디오·이미지 S3 업로드
3. **WebSocket**: 응시 중 타이머 동기화 + 감독관 실시간 모니터링 (Phase 2)

---

## 1. API 전체 목록

### 문제 출제 모듈
| 메서드 | 경로 | 설명 | 역할 |
|--------|------|------|------|
| GET | /api/question-bank/questions | 문제은행 유형별 문항 조회 | QUESTION_AUTHOR, ADMIN+ |
| GET | /api/question-bank/questions/:bankId | 문항 상세 (미리보기) | QUESTION_AUTHOR, ADMIN+ |
| POST | /api/question-module/exam-sets | 시험세트 생성 (DRAFT) | QUESTION_AUTHOR, ADMIN+ |
| PUT | /api/question-module/exam-sets/:id | 시험세트 수정 | QUESTION_AUTHOR, ADMIN+ |
| GET | /api/question-module/exam-sets | 세트 목록 | QUESTION_AUTHOR, ADMIN+ |
| GET | /api/question-module/exam-sets/:id | 세트 상세 | QUESTION_AUTHOR, ADMIN+ |
| POST | /api/question-module/exam-sets/:id/upload | IBT 업로드 (DRAFT→ACTIVE) | ADMIN, SUPER_ADMIN |

### 파일 업로드
| 메서드 | 경로 | 설명 | 역할 |
|--------|------|------|------|
| POST | /api/media/upload | 이미지/오디오 파일 업로드 | QUESTION_AUTHOR, ADMIN+ |

---

## 2. 문제은행 API 연동 (Mock → 실제 교체 구조)

```typescript
// src/modules/question-module/questionBankClient.ts
// ※ 이 파일만 교체하면 Mock → 실제 API 전환 완료

import axios from "axios";
import { env } from "../../config/env";

export interface QuestionBankQuery {
  typeCode: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | "ALL";
  keyword?: string;
  count?: number;
  page?: number;
}

export interface QuestionBankItem {
  bankId: string;
  typeCode: string;
  section: string;
  difficulty: string;
  preview: string;
  hasAudio: boolean;
  hasImage: boolean;
  createdAt: string;
  usageCount: number;
}

export interface QuestionBankDetail extends QuestionBankItem {
  instruction: string;
  passageText?: string;
  audioUrl?: string;
  imageUrl?: string;
  options?: { label: string; text: string }[];
  correctAnswer?: string | string[];
  modelAnswer?: string;
  scoringCriteria?: string;
}

// ── Mock 구현 (문제은행 미제공 기간) ──────────────────────────
export async function fetchQuestionsByType(
  query: QuestionBankQuery
): Promise<{ items: QuestionBankItem[]; total: number }> {
  if (env.QUESTION_BANK_API_URL.includes("localhost:4000")) {
    // Mock 데이터 반환
    const items: QuestionBankItem[] = Array.from(
      { length: query.count ?? 20 },
      (_, i) => ({
        bankId: `MOCK-${query.typeCode}-${(query.page ?? 1) * 100 + i}`,
        typeCode: query.typeCode,
        section: query.typeCode.startsWith("LISTEN") ? "LISTENING"
               : query.typeCode.startsWith("WRITE")  ? "WRITING" : "READING",
        difficulty: "MEDIUM",
        preview: `[Mock] ${query.typeCode} 유형 문항 ${i + 1}번 미리보기`,
        hasAudio: query.typeCode.startsWith("LISTEN"),
        hasImage: false,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      })
    );
    return { items, total: 100 };
  }

  // 실제 API 호출
  const response = await axios.get(`${env.QUESTION_BANK_API_URL}/questions`, {
    params: query,
    headers: { "X-API-Key": env.QUESTION_BANK_API_KEY },
  });
  return response.data;
}

export async function fetchQuestionDetail(bankId: string): Promise<QuestionBankDetail> {
  if (env.QUESTION_BANK_API_URL.includes("localhost:4000")) {
    // Mock 상세
    return {
      bankId,
      typeCode: bankId.split("-")[1],
      section: "READING",
      difficulty: "MEDIUM",
      preview: `[Mock] ${bankId} 상세 미리보기`,
      hasAudio: false, hasImage: false,
      createdAt: new Date().toISOString(), usageCount: 0,
      instruction: `[Mock] 다음을 읽고 물음에 답하십시오. (${bankId})`,
      options: [
        { label: "①", text: "Mock 선택지 1" },
        { label: "②", text: "Mock 선택지 2" },
        { label: "③", text: "Mock 선택지 3" },
        { label: "④", text: "Mock 선택지 4" },
      ],
      correctAnswer: "①",
    };
  }
  const res = await axios.get(`${env.QUESTION_BANK_API_URL}/questions/${bankId}`, {
    headers: { "X-API-Key": env.QUESTION_BANK_API_KEY },
  });
  return res.data;
}
```

---

## 3. 문제은행 조회 엔드포인트

```typescript
// GET /api/question-bank/questions
export async function getQuestionsByType(req: Request, res: Response) {
  const { typeCode, difficulty, keyword, count = "20", page = "1" } = req.query as Record<string, string>;

  if (!typeCode) return res.status(400).json({ error: "typeCode가 필요합니다." });

  const result = await fetchQuestionsByType({
    typeCode, difficulty: difficulty as any, keyword,
    count: Number(count), page: Number(page),
  });

  res.json(result);
}

// GET /api/question-bank/questions/:bankId
export async function getQuestionDetail(req: Request, res: Response) {
  const detail = await fetchQuestionDetail(req.params.bankId);
  res.json(detail);
}
```

---

## 4. 시험세트 생성 및 IBT 업로드

```typescript
// POST /api/question-module/exam-sets
export async function createExamSet(req: Request, res: Response) {
  const { name, examType, description, sections } = req.body;
  // sections: { LISTENING: { bankIds: [], durationMinutes: 40 }, WRITING: {...}, READING: {...} }

  const examSetNumber = await generateExamSetNumber(); // 자동 채번: "001", "002"...

  const examSet = await prisma.examSet.create({
    data: {
      examSetNumber, name, examType, description,
      status: "DRAFT",
      sectionsJson: sections,
    },
  });

  res.status(201).json({ examSetId: examSet.id, examSetNumber: examSet.examSetNumber });
}

async function generateExamSetNumber(): Promise<string> {
  const count = await prisma.examSet.count();
  return String(count + 1).padStart(3, "0");
}

// POST /api/question-module/exam-sets/:id/upload
// 핵심: 문제은행에서 스냅샷 저장 후 ACTIVE 전환
export async function uploadExamSet(req: Request, res: Response) {
  const { id } = req.params;

  const examSet = await prisma.examSet.findUnique({ where: { id } });
  if (!examSet) return res.status(404).json({ error: "시험세트를 찾을 수 없습니다." });
  if (examSet.status !== "DRAFT") {
    return res.status(400).json({ error: "DRAFT 상태의 세트만 업로드할 수 있습니다." });
  }

  const sections = examSet.sectionsJson as Record<string, { bankIds: string[]; durationMinutes: number }>;

  // ── 유효성 검증 ────────────────────────────────────────────
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [section, data] of Object.entries(sections)) {
    if (!data.bankIds || data.bankIds.length === 0) {
      errors.push(`${section} 영역 문항이 없습니다.`);
    }
    if (section === "LISTENING") {
      // 듣기 문항 오디오 확인 (문제은행에서 조회)
      for (let i = 0; i < data.bankIds.length; i++) {
        try {
          const detail = await fetchQuestionDetail(data.bankIds[i]);
          if (!detail.hasAudio) errors.push(`듣기 ${i + 1}번 문항에 오디오가 없습니다.`);
        } catch { warnings.push(`듣기 ${i + 1}번 문항 확인 실패`); }
      }
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({ errors, warnings });
  }

  // ── 문제은행 스냅샷 저장 ───────────────────────────────────
  const snapshot: Record<string, QuestionBankDetail[]> = {};
  for (const [section, data] of Object.entries(sections)) {
    snapshot[section] = await Promise.all(
      data.bankIds.map(id => fetchQuestionDetail(id))
    );
  }

  // DRAFT → ACTIVE 전환
  await prisma.examSet.update({
    where: { id },
    data: {
      status: "ACTIVE",
      snapshotJson: snapshot,
      uploadedAt: new Date(),
      uploadedById: req.admin!.sub,
    },
  });

  res.json({
    success: true,
    examSetId: id,
    status: "ACTIVE",
    snapshotSavedAt: new Date().toISOString(),
    warnings,
  });
}
```

---

## 5. 파일 업로드 (S3)

```typescript
// src/shared/utils/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../../config/env";
import { randomUUID } from "crypto";

const s3 = new S3Client({ region: env.AWS_REGION ?? "ap-northeast-2" });

export async function uploadToS3(
  buffer: Buffer,
  mimeType: string,
  prefix: string
): Promise<string> {
  const ext = mimeType.split("/")[1];
  const key = `${prefix}-${randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: "public-read",
  }));

  return `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

// POST /api/media/upload
// Body: FormData { file: File, type: "image" | "audio" }
export async function uploadMedia(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: "파일이 없습니다." });

  const { type = "image" } = req.body;
  const prefix = type === "audio" ? "audio" : "images";
  const allowed = type === "audio"
    ? ["audio/mpeg", "audio/mp3", "audio/wav"]
    : ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(req.file.mimetype)) {
    return res.status(400).json({ error: `허용되지 않는 파일 형식: ${req.file.mimetype}` });
  }

  const url = await uploadToS3(req.file.buffer, req.file.mimetype, prefix);
  res.json({ url });
}
```

---

## 6. WebSocket — 실시간 모니터링 (Phase 2)

```typescript
// src/websocket/index.ts
import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { verifyAdminToken, verifyExamineeToken } from "../shared/utils/jwt";

export function initWebSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: { origin: process.env.FRONTEND_URL ?? "http://localhost:5173" },
  });

  // ── 네임스페이스: /exam (응시자용) ───────────────────────────
  const examNs = io.of("/exam");
  examNs.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      socket.data.examinee = verifyExamineeToken(token);
      next();
    } catch { next(new Error("인증 실패")); }
  });

  examNs.on("connection", socket => {
    const examineeId = socket.data.examinee.sub;
    socket.join(`examinee:${examineeId}`);
    console.log(`응시자 연결: ${examineeId}`);

    // 타이머 동기화: 클라이언트가 서버 시간 요청
    socket.on("sync:time", (cb) => {
      cb({ serverTime: Date.now() });
    });

    socket.on("disconnect", () => {
      console.log(`응시자 연결 해제: ${examineeId}`);
    });
  });

  // ── 네임스페이스: /proctor (감독관용, Phase 2) ───────────────
  const proctorNs = io.of("/proctor");
  proctorNs.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const admin = verifyAdminToken(token);
      if (!["ADMIN","SUPER_ADMIN","PROCTOR"].includes(admin.role)) {
        return next(new Error("권한 없음"));
      }
      socket.data.admin = admin;
      next();
    } catch { next(new Error("인증 실패")); }
  });

  proctorNs.on("connection", socket => {
    console.log(`감독관 연결: ${socket.data.admin.loginId}`);

    // 감독관이 특정 응시자에게 시험 종료 허용 이벤트 전송
    socket.on("proctor:allow-exit", ({ examineeId }: { examineeId: string }) => {
      examNs.to(`examinee:${examineeId}`).emit("exam:allow-exit");
    });

    // 감독관이 응시자에게 강제 종료 명령
    socket.on("proctor:force-end", ({ examineeId }: { examineeId: string }) => {
      examNs.to(`examinee:${examineeId}`).emit("exam:force-end");
    });

    // 실시간 응시자 상태 구독
    socket.on("proctor:subscribe-room", ({ examSetId }: { examSetId: string }) => {
      socket.join(`room:${examSetId}`);
    });
  });

  // ── 응시 상태 변경 시 감독관에게 브로드캐스트 (서버 내부 호출용) ──
  (global as any).broadcastSessionUpdate = (
    examSetId: string,
    examineeId: string,
    status: string
  ) => {
    proctorNs.to(`room:${examSetId}`).emit("session:update", { examineeId, status });
  };

  return io;
}
```

---

## 7. 라우터 (question.router.ts)

```typescript
// src/modules/question-module/question.router.ts
import { Router } from "express";
import { adminAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = Router();

// 문제은행 조회 (출제자 + 어드민)
router.get(
  "/question-bank/questions",
  adminAuth, requireRole("QUESTION_AUTHOR","ADMIN","SUPER_ADMIN"),
  getQuestionsByType
);
router.get(
  "/question-bank/questions/:bankId",
  adminAuth, requireRole("QUESTION_AUTHOR","ADMIN","SUPER_ADMIN"),
  getQuestionDetail
);

// 시험세트 CRUD (출제자 + 어드민)
router.post(
  "/exam-sets",
  adminAuth, requireRole("QUESTION_AUTHOR","ADMIN","SUPER_ADMIN"),
  createExamSet
);
router.put(
  "/exam-sets/:id",
  adminAuth, requireRole("QUESTION_AUTHOR","ADMIN","SUPER_ADMIN"),
  updateExamSet
);
router.get(
  "/exam-sets",
  adminAuth, requireRole("QUESTION_AUTHOR","ADMIN","SUPER_ADMIN"),
  listExamSets
);
router.get(
  "/exam-sets/:id",
  adminAuth, requireRole("QUESTION_AUTHOR","ADMIN","SUPER_ADMIN"),
  getExamSetDetail
);

// IBT 업로드 (어드민만)
router.post(
  "/exam-sets/:id/upload",
  adminAuth, requireRole("ADMIN","SUPER_ADMIN"),
  uploadExamSet
);

// 파일 업로드
router.post(
  "/media/upload",
  adminAuth, requireRole("QUESTION_AUTHOR","ADMIN","SUPER_ADMIN"),
  upload.single("file"),
  uploadMedia
);

export default router;
```

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 모든 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T1-05 | IBT 업로드 원자성 + 이중 업로드 방지 (A-03 + D-01)

**대상**: `src/modules/question/examSet.handler.ts` — `uploadExamSet` 함수

```typescript
// ✅ 수정: 전체 스냅샷 수집 완료 후 단일 updateMany + WHERE status=DRAFT
export async function uploadExamSet(req: Request, res: Response) {
  const { id, sections } = req.body;

  // 1. Redis 분산 락으로 동시 업로드 시도 차단 (T3-02)
  const lockKey = `upload_lock:${id}`;
  const locked = await redis.set(lockKey, "1", "NX", "EX", 300);
  if (!locked) {
    return res.status(429).json({
      error: "업로드가 이미 진행 중입니다. 잠시 후 다시 시도하세요."
    });
  }

  try {
    // 2. 모든 섹션 스냅샷 수집 (실패 시 throw → DB 미변경)
    const snapshot: Record<string, unknown[]> = {};
    for (const [section, data] of Object.entries(sections)) {
      snapshot[section] = await Promise.all(
        (data as any).bankIds.map(fetchQuestionDetail)
      );
    }

    // 3. 스냅샷 완전 수집 완료 후 단일 트랜잭션으로 DB 변경
    const updated = await prisma.examSet.updateMany({
      where: { id, status: "DRAFT" },  // DRAFT가 아니면 0건 → 이중 업로드 방지
      data: {
        status: "ACTIVE",
        snapshotJson: snapshot,
        uploadedAt: new Date()
      }
    });

    if (updated.count === 0) {
      return res.status(409).json({
        error: "이미 업로드된 세트이거나 존재하지 않습니다."
      });
    }

    return res.json({ message: "업로드 완료", examSetId: id });
  } finally {
    await redis.del(lockKey); // 성공/실패 모두 락 해제
  }
}
```

---

### T1-06 | 시험세트 번호 시퀀스 채번 (A-06 + I-03)

**대상**: `src/shared/utils/examSetNumber.ts` — `generateExamSetNumber` 함수

```typescript
// ❌ 기존: count() + 1 → 동시 생성 시 중복 번호 발급
const count = await prisma.examSet.count();
return String(count + 1).padStart(3, "0");

// ✅ 수정: PostgreSQL Sequence 사용 (경쟁 조건 원천 차단)
// Sequence는 TASK-09 마이그레이션에서 생성됨
export async function generateExamSetNumber(): Promise<string> {
  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('exam_set_number_seq')
  `;
  return String(result[0].nextval).padStart(6, "0"); // 상용: 6자리 패딩
}
```

---

### T1-07 | 서버 타이머 강제 제출 Job (D-03)

**대상**: `src/jobs/autoSubmit.job.ts` (신규 파일), `src/server.ts`

```typescript
// src/jobs/autoSubmit.job.ts
import { prisma } from "../config/database";
import { logger } from "../shared/utils/logger";

function getSectionDurationMs(examSet: any, section: string): number {
  // examSet 설정에서 해당 영역 제한 시간(분) 조회 후 ms 변환
  const durations: Record<string, number> = {
    LISTENING: 40 * 60 * 1000,
    WRITING: 50 * 60 * 1000,
    READING: 60 * 60 * 1000,
  };
  return durations[section] ?? 60 * 60 * 1000;
}

async function forceSubmitSection(sessionId: string, section: string) {
  await prisma.$transaction([
    prisma.examSession.update({
      where: { id: sessionId },
      data: {
        sectionProgressJson: {
          update: {
            [section]: { submittedAt: new Date(), isAutoSubmitted: true }
          }
        }
      }
    }),
    prisma.auditLog.create({
      data: {
        action: "AUTO_SUBMIT",
        targetType: "ExamSession",
        targetId: sessionId,
        detail: JSON.stringify({ section, reason: "timer_expired" }),
        createdAt: new Date()
      }
    })
  ]);
}

export async function autoSubmitExpiredSections(): Promise<void> {
  const sessions = await prisma.examSession.findMany({
    where: { status: "IN_PROGRESS" },
    include: { examSet: true }
  });

  for (const session of sessions) {
    const progress = session.sectionProgressJson as Record<string, any>;
    for (const [section, p] of Object.entries(progress)) {
      if (!p.startedAt || p.submittedAt) continue;
      const elapsed = Date.now() - new Date(p.startedAt).getTime();
      const allowed = getSectionDurationMs(session.examSet, section) + 30_000;
      if (elapsed > allowed) {
        await forceSubmitSection(session.id, section);
        logger.warn(`[AutoSubmit] session=${session.id} section=${section}`);
      }
    }
  }
}

// src/server.ts에 추가
// import { autoSubmitExpiredSections } from "./jobs/autoSubmit.job";
// setInterval(autoSubmitExpiredSections, 60_000); // 1분마다 체크
```

---

### T2-03 | ExamSet 상태 전환 규칙 강제 (C-03)

**대상**: `src/shared/utils/examSetStatus.ts` (신규 파일), 모든 상태 변경 핸들러

```typescript
// src/shared/utils/examSetStatus.ts
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT:    ["ACTIVE"],
  UPLOADED: ["ACTIVE"],
  ACTIVE:   ["ARCHIVED"],
  ARCHIVED: [],  // 재활성화 불가
};

export function assertStatusTransition(from: string, to: string): void {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(400, `상태 전환 불가: ${from} → ${to}`);
  }
}

// 사용 예: uploadExamSet, archiveExamSet 등 모든 상태 변경 전 호출
// assertStatusTransition(currentSet.status, "ACTIVE");
```

---

### T3-02 | IBT 업로드 Redis 분산 락 (A-03 운영 측면)

> T1-05 코드에 이미 통합됨. Redis 설정 추가 필요:

```typescript
// src/config/redis.ts (신규)
import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL);

// .env에 추가
// REDIS_URL=redis://localhost:6379

// package.json에 추가
// "ioredis": "^5.3.2"
```

---

### T3-04 | 강제 제출 감사 로그 기록 (D-03 운영 측면)

> T1-07 autoSubmit.job.ts 코드에 이미 통합됨 (`auditLog.create` 포함)
> `AuditLog` 모델을 `prisma/schema.prisma`에 추가 필요:

```prisma
// prisma/schema.prisma에 추가
model AuditLog {
  id         String   @id @default(cuid())
  action     String   // AUTO_SUBMIT, FORCE_TERMINATE, etc.
  targetType String   // ExamSession, ExamSet, etc.
  targetId   String
  detail     Json?
  createdAt  DateTime @default(now())

  @@index([targetType, targetId])
  @@index([action, createdAt])
}
```

---

### T3-06 | 감독관 세션 강제 종료 API + WebSocket 알림 (운영 필수)

**대상**: `src/modules/question/proctor.handler.ts` (신규 추가), WebSocket `/proctor` namespace

```typescript
// src/modules/admin/proctor.handler.ts (신규)
export async function forceTerminateSession(req: Request, res: Response) {
  const { sessionId, reason } = req.body;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.examSession.updateMany({
      where: { id: sessionId, status: "IN_PROGRESS" },
      data: {
        status: "TERMINATED",
        terminatedAt: new Date(),
        terminationReason: reason
      }
    });
    if (updated.count === 0) {
      throw new AppError(404, "진행 중인 세션을 찾을 수 없습니다.");
    }
    await tx.auditLog.create({
      data: {
        action: "FORCE_TERMINATE",
        targetType: "ExamSession",
        targetId: sessionId,
        detail: JSON.stringify({ reason, proctorId: req.admin!.id }),
        createdAt: new Date()
      }
    });
  });

  // 트랜잭션 커밋 후 WebSocket 알림 (응시자 화면 강제 종료)
  io.to(`session:${sessionId}`).emit("sessionTerminated", {
    reason,
    message: "감독관에 의해 시험이 종료되었습니다."
  });

  return res.json({ message: "세션이 종료되었습니다." });
}

// admin.router.ts에 라우트 추가
// POST /api/admin/sessions/:sessionId/terminate → requireRole("PROCTOR") → forceTerminateSession
```

## 8. 완료 조건 (Acceptance Criteria)

- [ ] `GET /api/question-bank/questions?typeCode=READ_MCQ_SINGLE`: Mock 데이터 반환
- [ ] `env.QUESTION_BANK_API_URL`을 실제 URL로 교체 시 실제 API 호출로 전환
- [ ] `POST /api/question-module/exam-sets`: DRAFT 세트 생성 + examSetNumber 자동 채번
- [ ] `POST /api/question-module/exam-sets/:id/upload`: 유효성 검증 오류 시 422 반환
- [ ] IBT 업로드 성공 후 `GET /api/admin/exam-sets?status=ACTIVE`에 즉시 반영 (TASK-11 연계)
- [ ] `POST /api/media/upload`: 이미지(jpg/png/webp), 오디오(mp3/wav) 업로드 성공
- [ ] 허용되지 않는 파일 형식 업로드 시 400 반환
- [ ] WebSocket `/exam` 네임스페이스: 응시자 연결·타이머 동기화 동작 (Phase 2)
- [ ] WebSocket `/proctor` 네임스페이스: 감독관 allow-exit 이벤트 → 응시자에 전달 (Phase 2)

---

## 9. 추가 패키지

```bash
npm install socket.io @aws-sdk/client-s3 axios
npm install -D @types/multer
```


---

## 10. 동시시작 WebSocket 카운트다운 브로드캐스트 (SYNC-03~05)

### 개요

서버는 `scheduledStartAt`이 설정된 ExamSet에 대해 T-10초부터 매 1초마다
`exam:countdown` 이벤트를 해당 시험세트 룸에 브로드캐스트한다.
T=0초에 `exam:start` 이벤트를 브로드캐스트하여 모든 응시자의 시험이 동시에 시작된다.

---

### 10.1 WebSocket 대기실 룸 참여 처리 (`/exam` 네임스페이스 업데이트)

```typescript
// src/websocket/index.ts — examNs 업데이트

examNs.on("connection", (socket) => {
  const examineeId = socket.data.examinee.sub;
  socket.join(`examinee:${examineeId}`);
  console.log(`응시자 연결: ${examineeId}`);

  // 타이머 동기화
  socket.on("sync:time", (cb) => {
    cb({ serverTime: Date.now() });
  });

  // ✅ 대기실 룸 참여 (시험세트 기반 그룹 브로드캐스트용)
  socket.on("waiting:join", async ({ examSetId }: { examSetId: string }) => {
    // 배정된 시험세트인지 검증
    const examinee = await prisma.examinee.findUnique({
      where: { id: examineeId },
      select: { assignedExamSetId: true },
    });
    if (examinee?.assignedExamSetId === examSetId) {
      socket.join(`waiting:${examSetId}`);
      console.log(`응시자 ${examineeId} → 대기실 룸 [waiting:${examSetId}] 참여`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`응시자 연결 해제: ${examineeId}`);
  });
});
```

---

### 10.2 카운트다운 스케줄러 (서버 시작 시 초기화)

```typescript
// src/websocket/countdownScheduler.ts

import { Server as SocketServer } from "socket.io";
import { prisma } from "../config/database";
import { logger } from "../shared/utils/logger";

/**
 * 동시시작 카운트다운 스케줄러
 * - 30초마다 scheduledStartAt이 60초 이내인 ExamSet을 폴링
 * - T-10초부터 매 1초 exam:countdown 브로드캐스트
 * - T=0초에 exam:start 브로드캐스트
 */
export function startCountdownScheduler(io: SocketServer): void {
  const examNs = io.of("/exam");

  // 진행 중인 카운트다운 관리: examSetId → intervalId
  const activeCountdowns = new Map<string, NodeJS.Timeout>();

  // 30초마다 폴링하여 임박한 시험 확인
  setInterval(async () => {
    const now = new Date();
    const lookAheadMs = 60 * 1000; // 60초 이내 시작 예정 세트 조회

    const upcomingSets = await prisma.examSet.findMany({
      where: {
        scheduledStartAt: {
          gte: now,
          lte: new Date(now.getTime() + lookAheadMs),
        },
        status: "ACTIVE",
      },
      select: { id: true, scheduledStartAt: true, name: true },
    });

    for (const set of upcomingSets) {
      if (!set.scheduledStartAt) continue;
      if (activeCountdowns.has(set.id)) continue; // 이미 카운트다운 중

      const msUntilStart = set.scheduledStartAt.getTime() - Date.now();
      const countdownStartMs = Math.max(
        0,
        msUntilStart - Number(process.env.EXAM_COUNTDOWN_SECONDS ?? "10") * 1000
      );

      logger.info(`[Countdown] 예약됨: examSetId=${set.id}, ${set.name}, T-${Math.ceil(msUntilStart/1000)}초`);

      // T-10초가 될 때까지 대기 후 카운트다운 시작
      const startTimer = setTimeout(() => {
        let secondsLeft = Number(process.env.EXAM_COUNTDOWN_SECONDS ?? "10");

        // 1초마다 exam:countdown 이벤트 브로드캐스트
        const countdownInterval = setInterval(() => {
          if (secondsLeft > 0) {
            examNs.to(`waiting:${set.id}`).emit("exam:countdown", {
              seconds: secondsLeft,
              examSetId: set.id,
            });
            logger.debug(`[Countdown] examSetId=${set.id}, seconds=${secondsLeft}`);
            secondsLeft--;
          } else {
            // T=0: exam:start 브로드캐스트
            examNs.to(`waiting:${set.id}`).emit("exam:start", {
              examSetId: set.id,
              startedAt: new Date().toISOString(),
            });
            logger.info(`[Countdown] 시험 시작! examSetId=${set.id}`);

            clearInterval(countdownInterval);
            activeCountdowns.delete(set.id);
          }
        }, 1000);

        activeCountdowns.set(set.id, countdownInterval);
      }, countdownStartMs);

      // startTimer도 관리 (Map에 임시 저장)
      activeCountdowns.set(`pending:${set.id}`, startTimer as any);
    }
  }, 30 * 1000); // 30초마다 폴링

  logger.info("[Countdown] 동시시작 스케줄러 시작됨");
}
```

---

### 10.3 서버 초기화 시 스케줄러 등록 (server.ts)

```typescript
// src/server.ts — 업데이트
import { initWebSocket } from "./websocket/index";
import { startCountdownScheduler } from "./websocket/countdownScheduler";

const httpServer = createServer(app);
const io = initWebSocket(httpServer);

// ✅ 동시시작 카운트다운 스케줄러 시작
startCountdownScheduler(io);

httpServer.listen(env.PORT, () => {
  logger.info(`서버 실행 중: http://localhost:${env.PORT}`);
});
```

---

### 10.4 WebSocket 이벤트 명세 (전체)

| 이벤트명 | 방향 | 네임스페이스 | 데이터 | 설명 |
|---------|------|------------|--------|------|
| `waiting:join` | Client → Server | `/exam` | `{ examSetId: string }` | 응시자가 대기실 룸에 참여 |
| `exam:countdown` | Server → Client | `/exam` | `{ seconds: number, examSetId: string }` | T-10초부터 매 1초 카운트다운 |
| `exam:start` | Server → Client | `/exam` | `{ examSetId: string, startedAt: string }` | T=0초 시험 시작 신호 |
| `sync:time` | Client → Server | `/exam` | 없음 (callback) | 서버 시각 동기화 |
| `proctor:allow-exit` | Client → Server | `/proctor` | `{ examineeId: string }` | 감독관 → 개별 퇴장 허용 |
| `proctor:force-end` | Client → Server | `/proctor` | `{ examineeId: string }` | 감독관 → 개별 강제 종료 |
| `exam:allow-exit` | Server → Client | `/exam` | 없음 | 퇴장 허용 수신 |
| `exam:force-end` | Server → Client | `/exam` | 없음 | 강제 종료 수신 |

---

### 10.5 완료 조건 추가 (동시시작)

- [ ] `waiting:join` 이벤트 수신 시 응시자 검증 후 `waiting:{examSetId}` 룸 참여
- [ ] `startCountdownScheduler`: 서버 시작 시 초기화, 30초 폴링으로 임박한 ExamSet 탐지
- [ ] `scheduledStartAt` T-10초부터 매 1초 `exam:countdown` 브로드캐스트
- [ ] T=0초에 `exam:start` 브로드캐스트 후 인터벌 해제
- [ ] 동시에 여러 ExamSet 카운트다운 병행 처리 (activeCountdowns Map)
- [ ] `EXAM_COUNTDOWN_SECONDS` 환경변수로 카운트다운 시간 설정 가능 (기본 10초)

---

## ✅ 구현 현황 (2026-03-10 업데이트)

### 완료 조건 체크리스트

**문제은행 API**:
- [x] questionBankClient.ts — Mock + 실 API 토글 (localhost:4000 감지)
- [x] GET /api/question-bank/questions — typeCode/difficulty/keyword 필터
- [x] GET /api/question-bank/questions/:bankId — 상세 조회

**시험세트 CRUD**:
- [x] POST /api/question-module/exam-sets — DRAFT 생성 + 자동 번호 (T1-06)
- [x] PUT /api/question-module/exam-sets/:id — DRAFT만 수정 가능
- [x] GET /api/question-module/exam-sets — 목록 (상태 필터, 페이지네이션)
- [x] GET /api/question-module/exam-sets/:id — 상세 (uploadedBy, counts)

**IBT 업로드**:
- [x] POST /api/question-module/exam-sets/:id/upload — DRAFT→UPLOADED (T1-05 atomic)
- [x] examSetStatus.ts — 상태 전환 규칙 (T2-03)
- [x] examSetNumber.ts — 자동 번호 채번

**파일 업로드**:
- [x] POST /api/media/upload — multer 50MB, MIME 검증 (jpeg/png/webp/mpeg/mp3/wav)
- [x] s3.ts — uploadToS3 + dev mock fallback

**WebSocket**:
- [x] /exam 네임스페이스 — 토큰 인증, waiting:join, sync:time
- [x] /proctor 네임스페이스 — 어드민 인증, allow-exit, force-end
- [x] countdownScheduler.ts — 30초 polling, T-10초 카운트다운, exam:start

**자동 제출**:
- [x] autoSubmit.job.ts — 섹션 시간 초과 + 30초 grace period
- [x] AuditLog 생성 (T3-04)
- [x] server.ts에 setInterval(60초) 연결 완료

**ACID 항목**:
- [x] T1-05: updateMany WHERE status='DRAFT' (이중 업로드 방지)
- [x] T1-06: 시험세트 번호 채번
- [x] T2-03: 상태 전환 규칙 강제
- [x] T3-04: 강제 제출 감사 로그

**Phase 2 (미구현)**:
- [ ] Redis 분산 락 (T3-02) — 현재 optimistic concurrency 사용

### 실제 파일 경로
```
server/src/
├── modules/question-module/
│   ├── question.router.ts
│   ├── questionBankClient.ts
│   └── handlers/ (8 handler files)
├── shared/utils/ (s3.ts, examSetStatus.ts, examSetNumber.ts)
├── websocket/ (index.ts, countdownScheduler.ts)
└── jobs/autoSubmit.job.ts
```
