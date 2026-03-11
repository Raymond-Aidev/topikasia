# TASK-10: 응시자 시험 API

> 연관 PRD: AUTH-03~06, LISTEN-01~06, WRITE-01~05, READ-01~08, SUBMIT-01~06, UI-03~04
> 연관 문서: [TASK-09 백엔드 서버셋업·인증](./TASK-09_백엔드_서버셋업_인증.md) · [TASK-01~05 프론트엔드](./TASK-01_공통UI_로그인_대기.md)
> 우선순위: Phase 1 (MVP 필수)
> 선행 조건: TASK-09 완료 후 시작

---

## 목표

응시자가 로그인 후 배정된 시험세트를 확인하고,
영역별 시험을 진행하며 답안을 저장·제출하는 전체 흐름의 서버 API를 구현한다.

---

## 1. API 전체 목록

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/exam/assigned-set | 배정된 시험세트 조회 | examAuth |
| POST | /api/exam/sessions | 시험 세션 생성 (시험 시작) | examAuth |
| GET | /api/exam/sessions/current | 현재 진행 중인 세션 조회 | examAuth |
| POST | /api/exam/sessions/:id/section-start | 영역 시작 기록 | examAuth |
| PUT | /api/exam/sessions/:sessionId/answers | 답안 저장 (자동저장) | examAuth |
| POST | /api/exam/sessions/:id/submit-section | 영역 답안 제출 | examAuth |
| POST | /api/exam/sessions/:id/complete | 시험 최종 완료 | examAuth |

---

## 2. 배정된 시험세트 조회

```typescript
// GET /api/exam/assigned-set
// src/modules/exam/handlers/getAssignedSet.ts

export async function getAssignedSet(req: Request, res: Response) {
  const examineeId = req.examinee!.sub;

  const examinee = await prisma.examinee.findUnique({
    where: { id: examineeId },
    include: { assignedExamSet: true },
  });

  if (!examinee?.assignedExamSet) {
    return res.status(404).json({
      error: "배정된 시험세트가 없습니다. 관리자에게 문의하세요.",
    });
  }

  const set = examinee.assignedExamSet;
  const sections = set.sectionsJson as Record<string, { bankIds: string[]; durationMinutes: number }>;

  // 영역별 문항 수와 시간 계산
  const sectionSummary = Object.entries(sections).map(([section, data]) => ({
    section,
    questionCount: data.bankIds.length,
    durationMinutes: data.durationMinutes,
  }));

  const totalDuration = sectionSummary.reduce((sum, s) => sum + s.durationMinutes, 0);

  res.json({
    examSetId: set.id,
    examSetNumber: set.examSetNumber,
    name: set.name,
    examType: set.examType,
    sections: sectionSummary,
    totalDurationMinutes: totalDuration,
  });
}
```

---

## 3. 시험 세션 생성 (시험 시작)

```typescript
// POST /api/exam/sessions
// Body: { examSetId: string }

export async function createExamSession(req: Request, res: Response) {
  const examineeId = req.examinee!.sub;
  const { examSetId } = req.body;

  // 이미 진행 중인 세션이 있는지 확인
  const existing = await prisma.examSession.findFirst({
    where: { examineeId, status: "IN_PROGRESS" },
  });
  if (existing) {
    return res.json({ sessionId: existing.id, resumed: true });
  }

  // 배정된 세트인지 확인
  const examinee = await prisma.examinee.findUnique({
    where: { id: examineeId },
    include: { assignedExamSet: true },
  });
  if (examinee?.assignedExamSetId !== examSetId) {
    return res.status(403).json({ error: "배정된 시험세트가 아닙니다." });
  }

  // ── 동시시작 진입 차단 검사 (SYNC-06) ────────────────────────────
  // scheduledStartAt이 설정된 경우, 해당 시각 이후 진입 시도는 차단한다.
  const examSet = examinee.assignedExamSet;
  if (examSet?.scheduledStartAt) {
    const graceSeconds = Number(process.env.EXAM_LATE_GRACE_SECONDS ?? "0");
    const deadline = new Date(examSet.scheduledStartAt.getTime() + graceSeconds * 1000);
    const now = new Date();

    if (now > deadline) {
      return res.status(403).json({
        error: "시험이 이미 시작되었습니다.",
        code: "EXAM_ALREADY_STARTED",
        scheduledStartAt: examSet.scheduledStartAt.toISOString(),
      });
    }
  }

  const session = await prisma.examSession.create({
    data: {
      examineeId,
      examSetId,
      status: "IN_PROGRESS",
      sectionProgressJson: {
        LISTENING: { startedAt: null, submittedAt: null, isAutoSubmitted: false },
        WRITING:   { startedAt: null, submittedAt: null, isAutoSubmitted: false },
        READING:   { startedAt: null, submittedAt: null, isAutoSubmitted: false },
      },
    },
  });

  res.status(201).json({ sessionId: session.id, resumed: false });
}
```

---

## 4. 영역 시작 기록

```typescript
// POST /api/exam/sessions/:id/section-start
// Body: { section: "LISTENING" | "WRITING" | "READING" }

export async function recordSectionStart(req: Request, res: Response) {
  const { id: sessionId } = req.params;
  const { section } = req.body;
  const examineeId = req.examinee!.sub;

  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, examineeId },
  });
  if (!session) return res.status(404).json({ error: "세션을 찾을 수 없습니다." });

  const progress = session.sectionProgressJson as Record<string, any>;
  if (progress[section]?.startedAt) {
    // 이미 시작됨: 기존 시작 시각 반환 (새로고침 대응)
    return res.json({ startedAt: progress[section].startedAt, alreadyStarted: true });
  }

  const startedAt = new Date().toISOString();
  progress[section].startedAt = startedAt;

  await prisma.examSession.update({
    where: { id: sessionId },
    data: { sectionProgressJson: progress },
  });

  res.json({ startedAt, alreadyStarted: false });
}
```

---

## 5. 답안 저장 (자동저장, Upsert)

```typescript
// PUT /api/exam/sessions/:sessionId/answers
// Body: { answers: AnswerSaveRequest[] }

interface AnswerSaveRequest {
  questionBankId: string;
  section: string;
  questionIndex: number;
  answerJson: Record<string, unknown>; // 유형별 답안
}

export async function saveAnswers(req: Request, res: Response) {
  const { id: sessionId } = req.params;
  const { answers }: { answers: AnswerSaveRequest[] } = req.body;
  const examineeId = req.examinee!.sub;

  // 세션 소유자 확인
  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, examineeId },
  });
  if (!session) {
    return res.status(403).json({ error: "권한이 없는 세션입니다." });
  }

  // Upsert: 있으면 업데이트, 없으면 생성
  await prisma.$transaction(
    answers.map(a =>
      prisma.answer.upsert({
        where: { sessionId_questionBankId: { sessionId, questionBankId: a.questionBankId } },
        update: { answerJson: a.answerJson, savedAt: new Date() },
        create: {
          sessionId,
          questionBankId: a.questionBankId,
          section: a.section,
          questionIndex: a.questionIndex,
          answerJson: a.answerJson,
        },
      })
    )
  );

  res.json({ saved: answers.length, savedAt: new Date().toISOString() });
}
```

---

## 6. 영역 답안 제출

```typescript
// POST /api/exam/sessions/:id/submit-section
// Body: { sectionName: "LISTENING" | "WRITING" | "READING", isAutoSubmitted?: boolean }

export async function submitSection(req: Request, res: Response) {
  const { id: sessionId } = req.params;
  const { section, isAutoSubmitted = false } = req.body;
  const examineeId = req.examinee!.sub;

  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, examineeId },
  });
  if (!session) return res.status(404).json({ error: "세션을 찾을 수 없습니다." });

  const submittedAt = new Date().toISOString();
  const progress = session.sectionProgressJson as Record<string, any>;
  progress[section].submittedAt = submittedAt;
  progress[section].isAutoSubmitted = isAutoSubmitted;

  // 해당 영역 답안에 submittedAt 일괄 업데이트
  await prisma.$transaction([
    prisma.examSession.update({
      where: { id: sessionId },
      data: { sectionProgressJson: progress },
    }),
    prisma.answer.updateMany({
      where: { sessionId, section, submittedAt: null },
      data: { submittedAt: new Date(), isAutoSubmitted },
    }),
  ]);

  res.json({ section, submittedAt, isAutoSubmitted });
}
```

---

## 7. 시험 최종 완료

```typescript
// POST /api/exam/sessions/:id/complete

export async function completeSession(req: Request, res: Response) {
  const { id: sessionId } = req.params;
  const examineeId = req.examinee!.sub;

  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, examineeId, status: "IN_PROGRESS" },
  });
  if (!session) return res.status(404).json({ error: "진행 중인 세션을 찾을 수 없습니다." });

  await prisma.examSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  res.json({ sessionId, completedAt: new Date().toISOString() });
}
```

---

## 8. 현재 진행 중인 세션 조회 (새로고침 복구)

```typescript
// GET /api/exam/sessions/current
// 목적: 브라우저 새로고침 또는 재접속 시 기존 세션 복구

export async function getCurrentSession(req: Request, res: Response) {
  const examineeId = req.examinee!.sub;

  const session = await prisma.examSession.findFirst({
    where: { examineeId, status: "IN_PROGRESS" },
    include: { answers: true },
  });

  if (!session) return res.json({ session: null });

  // 현재 어느 영역까지 진행했는지 계산
  const progress = session.sectionProgressJson as Record<string, any>;
  const currentSection = Object.entries(progress).find(
    ([, v]) => v.startedAt && !v.submittedAt
  )?.[0] ?? null;

  res.json({
    sessionId: session.id,
    examSetId: session.examSetId,
    currentSection,
    progress,
    answers: session.answers.map(a => ({
      questionBankId: a.questionBankId,
      section: a.section,
      questionIndex: a.questionIndex,
      answerJson: a.answerJson,
    })),
  });
}
```

---

## 9. 라우터 (exam.router.ts)

```typescript
// src/modules/exam/exam.router.ts
import { Router } from "express";
import { examAuth } from "../../middleware/auth.middleware";
import { getAssignedSet }    from "./handlers/getAssignedSet";
import { createExamSession } from "./handlers/createExamSession";
import { getCurrentSession } from "./handlers/getCurrentSession";
import { recordSectionStart } from "./handlers/recordSectionStart";
import { saveAnswers }        from "./handlers/saveAnswers";
import { submitSection }      from "./handlers/submitSection";
import { completeSession }    from "./handlers/completeSession";

const router = Router();

router.use(examAuth); // 모든 라우트에 인증 적용

router.get("/assigned-set",               getAssignedSet);
router.post("/sessions",                  createExamSession);
router.get("/sessions/current",           getCurrentSession);
router.post("/sessions/:id/section-start", recordSectionStart);
router.put("/sessions/:id/answers",       saveAnswers);
router.post("/sessions/:id/submit-section", submitSection);
router.post("/sessions/:id/complete",     completeSession);

export default router;
```

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 모든 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T1-02 | 세션 중복 생성 방지 — TOCTOU 해소 (A-04 + I-02 + C-01)

**대상**: `src/modules/exam/examSession.handler.ts` — `createExamSession` 함수

```typescript
// ✅ 수정: DB 고유 제약 위반을 잡아 idempotent하게 처리
// (Partial Unique Index는 TASK-09 마이그레이션에서 생성)
export async function createExamSession(req: Request, res: Response) {
  const { examineeId, examSetId } = req.body;

  try {
    const session = await prisma.examSession.create({
      data: {
        examineeId,
        examSetId,
        status: "IN_PROGRESS",
        sectionProgressJson: {}
      }
    });
    return res.status(201).json({ sessionId: session.id });
  } catch (e: any) {
    if (e.code === "P2002") {
      // DB Unique 제약 위반 → 이미 존재하는 세션 반환 (idempotent)
      const existing = await prisma.examSession.findFirst({
        where: { examineeId, status: "IN_PROGRESS" }
      });
      return res.json({ sessionId: existing!.id, resumed: true });
    }
    throw e;
  }
}
```

---

### T1-08 | 답안 제출 멱등성 (신규 발굴)

**대상**: `src/modules/exam/answer.handler.ts` — `saveAnswers` 함수

```typescript
// ✅ upsert + updatedAt 기록으로 멱등성 보장
// IndexedDB 재시도 시 동일 답안 중복 제출 안전 처리
await prisma.$transaction(
  answers.map(a =>
    prisma.answer.upsert({
      where: {
        sessionId_questionCode: {
          sessionId: a.sessionId,
          questionCode: a.questionCode
        }
      },
      create: {
        sessionId: a.sessionId,
        questionCode: a.questionCode,
        answerValue: a.answerValue,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      update: {
        answerValue: a.answerValue,
        updatedAt: new Date()
        // createdAt 유지 → 최초 제출 시각 보존 (감사 추적용)
      }
    })
  )
);
```

> `@@unique([sessionId, questionCode])` 복합 유니크 인덱스가 `prisma/schema.prisma` Answer 모델에 반드시 존재해야 함

---

### T2-02 | 답안 저장 소유권 확인 → 트랜잭션 내부 이동 (A-05)

**대상**: `src/modules/exam/answer.handler.ts` — `saveAnswers` 함수

```typescript
// ❌ 기존: 소유권 확인이 트랜잭션 밖 → 확인 후 세션 강제 종료 가능
const sessions = await prisma.examSession.findMany(...); // 트랜잭션 밖
await prisma.$transaction(answers.map(a => prisma.answer.upsert(...)));

// ✅ 수정: 소유권 확인 + upsert를 단일 트랜잭션으로 묶음
await prisma.$transaction(async (tx) => {
  const sessions = await tx.examSession.findMany({
    where: {
      id: { in: sessionIds },
      examineeId,
      status: "IN_PROGRESS"  // 종료된 세션에는 저장 불가
    }
  });
  if (sessions.length !== sessionIds.length) {
    throw new AppError(403, "세션 소유권 없음 또는 세션이 종료되었습니다.");
  }
  await Promise.all(answers.map(a => tx.answer.upsert({ ... })));
});
```

---

### T2-05 | 영역 순서 서버 검증 (신규 발굴)

**대상**: `src/modules/exam/examSection.handler.ts` — `startSection` 함수

```typescript
// ✅ 신규 추가: 영역 시작 전 이전 영역 완료 여부를 서버에서 검증
const SECTION_ORDER = ["LISTENING", "WRITING", "READING"];

export async function startSection(req: Request, res: Response) {
  const { sessionId, section } = req.body;
  const session = await prisma.examSession.findUniqueOrThrow({
    where: { id: sessionId }
  });
  const progress = session.sectionProgressJson as Record<string, any>;

  const sectionIndex = SECTION_ORDER.indexOf(section);
  for (let i = 0; i < sectionIndex; i++) {
    const prev = SECTION_ORDER[i];
    if (!progress[prev]?.submittedAt) {
      return res.status(400).json({
        error: `${prev} 영역을 먼저 완료해야 합니다.`
      });
    }
  }
  // 정상 처리: 영역 시작 시각 기록
  // ...
}
```

---

### T2-06 | 시험 중 세트 변경 차단 (신규 발굴)

**대상**: `src/modules/exam/examSession.handler.ts` 또는 `src/modules/admin/examSet.handler.ts`

```typescript
// ✅ 어드민이 세트 변경 시 IN_PROGRESS 세션 확인 (트랜잭션 내)
export async function changeExamSet(req: Request, res: Response) {
  const { examineeId, newExamSetId } = req.body;

  await prisma.$transaction(async (tx) => {
    const activeSession = await tx.examSession.findFirst({
      where: { examineeId, status: "IN_PROGRESS" }
    });
    if (activeSession) {
      throw new AppError(
        409,
        "응시자가 현재 시험 중입니다. 세트 변경은 시험 완료 후 가능합니다."
      );
    }
    await tx.examinee.update({
      where: { id: examineeId },
      data: { assignedExamSetId: newExamSetId }
    });
  });

  return res.json({ message: "시험세트가 변경되었습니다." });
}
```

## 10. 완료 조건 (Acceptance Criteria)

- [ ] `GET /api/exam/assigned-set`: 배정 세트 정보 반환, 없을 경우 404
- [ ] `POST /api/exam/sessions`: 중복 세션 없이 생성, 이미 있으면 기존 반환
- [ ] 배정되지 않은 examSetId로 세션 시작 시 403
- [ ] `PUT /api/exam/answers`: 배열로 일괄 Upsert 처리
- [ ] `POST /api/exam/sessions/:id/submit`: submittedAt 기록 + isAutoSubmitted 처리
- [ ] `GET /api/exam/sessions/current`: 새로고침 후 기존 답안 복구 가능
- [ ] 타인 세션에 접근 시 403 반환


---

## SYNC 추가: 시험 시작 후 진입 차단 (SYNC-06~07)

### 진입 차단 API 응답 처리 (클라이언트 연동)

`POST /api/exam/sessions` 가 `HTTP 403 + { code: "EXAM_ALREADY_STARTED" }` 를 반환할 때,
클라이언트(WaitingRoomScreen)는 `/exam-blocked` 화면으로 리다이렉트한다.

```typescript
// 클라이언트 측 처리 (TASK-01 WaitingRoomScreen 참조)
const res = await fetch("/api/exam/sessions", { method: "POST", ... });
if (res.status === 403) {
  const body = await res.json();
  if (body.code === "EXAM_ALREADY_STARTED") {
    navigate("/exam-blocked"); // → ExamBlockedScreen (SCR-W02)
    return;
  }
}
```

### 완료 조건 추가

- [ ] `createExamSession`: `examSet.scheduledStartAt` 존재 시 현재 시각과 비교
- [ ] 시험 시작 시각 이후 접속 시 `HTTP 403 + { code: "EXAM_ALREADY_STARTED" }` 반환
- [ ] `EXAM_LATE_GRACE_SECONDS` 환경변수로 유예 시간 설정 가능 (기본값 0초)
- [ ] 기존 IN_PROGRESS 세션이 있는 경우(resumed: true)는 차단하지 않음 (중간 재접속 허용)

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] 배정된 시험세트 조회 (ACTIVE 검증 포함) — `server/src/modules/exam/handlers/getAssignedSet.ts`
- [x] 시험 세션 생성 (SYNC-06 늦은 진입 차단, P2002 idempotent) — `server/src/modules/exam/handlers/createExamSession.ts`
- [x] 현재 진행 중 세션 + 답안 조회 (새로고침 복구) — `server/src/modules/exam/handlers/getCurrentSession.ts`
- [x] 영역 시작 기록 (이전 섹션 완료 검증) — `server/src/modules/exam/handlers/recordSectionStart.ts`
- [x] 답안 저장 upsert (배열, 트랜잭션 내 소유권 검증) — `server/src/modules/exam/handlers/saveAnswers.ts`
- [x] 영역 답안 제출 (submittedAt + isAutoSubmitted) — `server/src/modules/exam/handlers/submitSection.ts`
- [x] 시험 최종 완료 — `server/src/modules/exam/handlers/completeSession.ts`
- [x] 시험 라우터 (examAuth 전체 적용) — `server/src/modules/exam/exam.router.ts`

### 미완료 항목 (Phase 2)
- [ ] T2-06: 시험 중 세트 변경 차단 — 어드민 API 측에서 구현 (TASK-11 참조)
- [ ] 답안 저장 실패 시 클라이언트 재시도 큐 연동 테스트
- [ ] 대규모 동시 접속 부하 테스트

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `src/modules/exam/handlers/getAssignedSet.ts` | `server/src/modules/exam/handlers/getAssignedSet.ts` | ✅ |
| `src/modules/exam/handlers/createExamSession.ts` | `server/src/modules/exam/handlers/createExamSession.ts` | ✅ |
| `src/modules/exam/handlers/getCurrentSession.ts` | `server/src/modules/exam/handlers/getCurrentSession.ts` | ✅ |
| `src/modules/exam/handlers/recordSectionStart.ts` | `server/src/modules/exam/handlers/recordSectionStart.ts` | ✅ |
| `src/modules/exam/handlers/saveAnswers.ts` | `server/src/modules/exam/handlers/saveAnswers.ts` | ✅ |
| `src/modules/exam/handlers/submitSection.ts` | `server/src/modules/exam/handlers/submitSection.ts` | ✅ |
| `src/modules/exam/handlers/completeSession.ts` | `server/src/modules/exam/handlers/completeSession.ts` | ✅ |
| `src/modules/exam/exam.router.ts` | `server/src/modules/exam/exam.router.ts` | ✅ |

### ACID 준수 현황
- [x] T1-02: 세션 중복 생성 방지 TOCTOU 해소 (P2002 catch + 기존 세션 반환) — `createExamSession.ts`
- [x] T1-08: 답안 제출 멱등성 (sessionId_questionBankId unique + upsert) — `saveAnswers.ts`
- [x] T2-02: 답안 저장 소유권 확인을 트랜잭션 내부로 이동 — `saveAnswers.ts`
- [x] T2-05: 영역 순서 서버 검증 (이전 섹션 submittedAt 확인) — `recordSectionStart.ts`
- [ ] T2-06: 시험 중 세트 변경 차단 (Phase 2, TASK-11 어드민 측에서 처리)

### 비고
- 라우트 경로가 문서 스펙(`/api/exam/answers`)과 구현(`/api/exam/sessions/:id/answers`)에서 일부 차이가 있음 — 구현이 RESTful 구조로 개선됨
- 섹션 제출 경로도 `/submit` → `/submit-section`으로 더 명시적으로 변경됨
- SYNC-06 동시시작 진입 차단 로직이 `createExamSession.ts`에 통합 완료
