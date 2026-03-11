# ACID 원칙 위배 분석 보고서

> 분석 대상: TASK-09 ~ TASK-12 (백엔드 구현 문서 전체)
> 작성일: 2026-03-10
> ACID: Atomicity(원자성) · Consistency(일관성) · Isolation(고립성) · Durability(지속성)

---

## 요약

| 원칙 | 위배 건수 | 심각도 |
|------|:---------:|--------|
| A — 원자성 | 6건 | 🔴 High 3건 / 🟡 Medium 3건 |
| C — 일관성 | 4건 | 🔴 High 2건 / 🟡 Medium 2건 |
| I — 고립성 | 4건 | 🔴 High 3건 / 🟡 Medium 1건 |
| D — 지속성 | 3건 | 🔴 High 1건 / 🟡 Medium 2건 |

---

## 1. Atomicity (원자성) 위배

> "한 작업의 모든 단계가 성공하거나, 전부 실패해야 한다"

---

### A-01 🔴 HIGH | 로그인 실패 카운트 증가 (TASK-09)

**위치**: `examLogin` 핸들러

**문제 코드**:
```typescript
const examinee = await prisma.examinee.findUnique(...); // 1. 조회
// ← 여기서 다른 요청이 끼어들 수 있음
await prisma.examinee.update({
  data: { loginFailCount: failCount + 1, status: newStatus }  // 2. 업데이트
});
```

**문제점**: `findUnique` → `update` 사이에 다른 로그인 요청이 개입하면 failCount를 덮어씁니다.
예) 두 요청이 동시에 failCount=3 을 읽고 둘 다 4로 업데이트 → 5회 잠금 우회 가능.

**수정 방법**:
```typescript
// Prisma atomic increment 사용
await prisma.examinee.update({
  where: { id: examinee.id },
  data: {
    loginFailCount: { increment: 1 },  // ← 원자적 증가
  },
});
// 잠금 여부는 업데이트 후 반환값으로 판단
```

---

### A-02 🔴 HIGH | 회원 생성: S3 업로드 ↔ DB INSERT 비원자 (TASK-11)

**위치**: `createExaminee` 핸들러

**문제 코드**:
```typescript
const photoUrl = await uploadToS3(...);    // 1. S3 업로드 성공
const examinee = await prisma.examinee.create(...); // 2. DB 생성 — 실패 가능
```

**문제점**: S3 업로드가 성공한 후 DB 생성이 실패(네트워크 오류, 중복 키 등)하면
S3에는 파일이 남지만 DB에는 레코드가 없는 **고아 파일(Orphan File)** 이 발생합니다.
반대로 S3 업로드 실패 시 예외가 throw되어 DB에는 아무것도 저장되지 않습니다.

**수정 방법**:
```typescript
// DB 먼저 생성 (photoUrl 없이) → 성공 후 S3 업로드 → URL 업데이트
const examinee = await prisma.examinee.create({ data: { ...fields, photoUrl: null } });
try {
  const photoUrl = await uploadToS3(...);
  await prisma.examinee.update({ where: { id: examinee.id }, data: { photoUrl } });
} catch {
  // 사진 업로드 실패해도 계정은 생성됨 — 나중에 재업로드 허용
}
```

---

### A-03 🔴 HIGH | IBT 업로드: 외부 API 호출 ↔ DB 상태 변경 비원자 (TASK-12)

**위치**: `uploadExamSet` 핸들러

**문제 코드**:
```typescript
// 1. 문제은행 API 호출 (외부 시스템) — 실패 가능
for (const [section, data] of Object.entries(sections)) {
  snapshot[section] = await Promise.all(
    data.bankIds.map(id => fetchQuestionDetail(id))
  );
}
// 2. DB 상태 변경 (DRAFT → ACTIVE) — 위와 비원자적
await prisma.examSet.update({ data: { status: "ACTIVE", snapshotJson: snapshot } });
```

**문제점**:
- LISTENING 스냅샷 20개 중 15개 성공 후 실패 → 부분 스냅샷으로 DB 업데이트 시도
- DB 업데이트 성공 후 서버 크래시 → ACTIVE 상태지만 스냅샷 불완전
- `Promise.all` 내부 하나라도 실패 시 전체 throw 되지만, section 루프는 순차적이라 일부 section만 성공 가능

**수정 방법**:
```typescript
// 스냅샷 전체 수집 완료 후 단일 트랜잭션으로 저장
// 실패 시 전부 롤백
const snapshot: Record<string, QuestionBankDetail[]> = {};
for (const [section, data] of Object.entries(sections)) {
  // 모든 section 스냅샷 수집 (실패 시 throw → DB 변경 없음)
  snapshot[section] = await Promise.all(data.bankIds.map(fetchQuestionDetail));
}
// 스냅샷 완전 수집 성공 후에만 DB 업데이트
await prisma.examSet.update({
  where: { id, status: "DRAFT" },  // ← status 조건 추가로 이중 업로드 방지
  data: { status: "ACTIVE", snapshotJson: snapshot, uploadedAt: new Date() },
});
```

---

### A-04 🟡 MEDIUM | 세션 생성: 중복 확인 ↔ INSERT 비원자 (TASK-10)

**위치**: `createExamSession` 핸들러

**문제 코드**:
```typescript
const existing = await prisma.examSession.findFirst(...); // 1. 중복 확인
if (existing) return res.json({ sessionId: existing.id });
// ← 두 번째 요청이 여기서 동일하게 "없음" 판단
const session = await prisma.examSession.create(...);    // 2. 생성
```

**문제점**: 응시자가 브라우저 두 탭에서 동시에 시험 시작 버튼을 누르면
두 개의 세션이 모두 생성될 수 있습니다.

**수정 방법**:
```typescript
// DB 레벨 유니크 제약 + upsert 패턴
// schema.prisma에 추가:
// @@unique([examineeId, examSetId, status]) — 단, status는 enum이라 부분 유니크 인덱스 필요

// 또는 PostgreSQL partial unique index (Prisma raw SQL 마이그레이션):
// CREATE UNIQUE INDEX one_active_session
//   ON "ExamSession" ("examineeId")
//   WHERE status = 'IN_PROGRESS';
```

---

### A-05 🟡 MEDIUM | 답안 저장: 소유권 확인 ↔ Upsert 비원자 (TASK-10)

**위치**: `saveAnswers` 핸들러

**문제 코드**:
```typescript
// 소유권 확인 (트랜잭션 밖)
const sessions = await prisma.examSession.findMany({ where: { id: { in: sessionIds }, examineeId } });

// ← 확인 후 세션이 강제 종료될 수 있음

// Upsert (트랜잭션 안)
await prisma.$transaction(answers.map(a => prisma.answer.upsert(...)));
```

**수정 방법**:
```typescript
// 소유권 확인을 트랜잭션 내부로 이동
await prisma.$transaction(async (tx) => {
  const sessions = await tx.examSession.findMany({ where: { id: { in: sessionIds }, examineeId } });
  if (sessions.length !== sessionIds.length) throw new Error("권한 없음");
  await Promise.all(answers.map(a => tx.answer.upsert(...)));
});
```

---

### A-06 🟡 MEDIUM | 시험세트 번호 자동 채번 (TASK-12)

**위치**: `generateExamSetNumber` 함수

**문제 코드**:
```typescript
const count = await prisma.examSet.count();  // 1. 현재 개수 조회
return String(count + 1).padStart(3, "0");   // 2. +1 반환
// ← 두 요청이 동시에 count=5 를 읽어 둘 다 "006" 반환
```

**수정 방법**:
```typescript
// PostgreSQL 시퀀스 사용 (Prisma raw query)
const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
  SELECT nextval('exam_set_number_seq')
`;
return String(result[0].nextval).padStart(3, "0");

// schema.prisma에 시퀀스 생성 마이그레이션 추가:
// CREATE SEQUENCE exam_set_number_seq START 1;
```

---

## 2. Consistency (일관성) 위배

> "트랜잭션 전후 데이터가 정의된 규칙을 항상 만족해야 한다"

---

### C-01 🔴 HIGH | 응시자 1인 1세션 제약 DB 레벨 미정의 (TASK-09 스키마)

**위치**: `schema.prisma` — ExamSession 모델

**문제점**: "동시에 진행 중인 세션은 1개뿐이어야 한다"는 규칙이 애플리케이션 코드에만 있고
DB 레벨 제약(Unique Index, Check Constraint)이 없습니다.
A-04와 같이 동시 요청이 들어오면 DB가 이를 막지 못합니다.

**수정 방법**:
```sql
-- Prisma 마이그레이션에 추가
CREATE UNIQUE INDEX uq_one_active_session
  ON "ExamSession" ("examineeId")
  WHERE status = 'IN_PROGRESS';
```

---

### C-02 🔴 HIGH | CASCADE 동작 미정의 (TASK-09 스키마)

**위치**: `schema.prisma` — 전체 관계 정의

**문제점**: 아래 관계에 `onDelete` 동작이 명시되지 않아 Prisma 기본값(RESTRICT)이 적용됩니다.

| 관계 | 현재 | 의도 |
|------|------|------|
| ExamSet 삭제 시 Examinee.assignedExamSetId | RESTRICT (삭제 불가) | SET NULL (배정 해제) |
| Examinee 삭제 시 ExamSession | RESTRICT | CASCADE (함께 삭제) |
| ExamSession 삭제 시 Answer | RESTRICT | CASCADE |
| AdminUser 삭제 시 createdExaminees | RESTRICT | SET NULL 또는 유지 |

**수정 방법**:
```prisma
model Examinee {
  assignedExamSet ExamSet? @relation(fields: [assignedExamSetId], references: [id], onDelete: SetNull)
  examSessions    ExamSession[]  // 아래에서 cascade 지정
}
model ExamSession {
  examinee  Examinee @relation(fields: [examineeId], references: [id], onDelete: Cascade)
  answers   Answer[]
}
model Answer {
  session ExamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

---

### C-03 🟡 MEDIUM | ExamSet 상태 전환 규칙 미강제 (TASK-12)

**위치**: `uploadExamSet` 핸들러 / schema.prisma

**문제점**: DRAFT → ACTIVE 전환은 `uploadExamSet`에서 확인하지만,
ACTIVE → DRAFT로 역행하거나 ARCHIVED → ACTIVE로 재활성화하는 것을
DB나 애플리케이션 레벨에서 명시적으로 차단하지 않습니다.

**수정 방법**:
```typescript
// 상태 전환 유효성 체크 유틸 추가
const VALID_TRANSITIONS: Record<ExamSetStatus, ExamSetStatus[]> = {
  DRAFT:    ["ACTIVE"],
  ACTIVE:   ["ARCHIVED"],
  ARCHIVED: [],
  UPLOADED: ["ACTIVE"],
};

function validateStatusTransition(from: ExamSetStatus, to: ExamSetStatus) {
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new Error(`상태 전환 불가: ${from} → ${to}`);
  }
}
```

---

### C-04 🟡 MEDIUM | assignedExamSetId에 ACTIVE 세트만 허용 DB 미강제 (TASK-11)

**위치**: `createExaminee` / `changeExamSet` 핸들러

**문제점**: 회원 배정 시 애플리케이션에서 `status: "ACTIVE"` 조건을 확인하지만,
DB FK 제약만으로는 DRAFT 세트를 배정하는 것을 막을 수 없습니다.
어드민이 직접 DB를 수정하거나 다른 경로로 배정하면 일관성이 깨집니다.

**수정 방법**:
```sql
-- PostgreSQL Check Constraint (Prisma raw 마이그레이션)
ALTER TABLE "Examinee"
  ADD CONSTRAINT chk_active_exam_set
  CHECK (
    "assignedExamSetId" IS NULL OR
    EXISTS (
      SELECT 1 FROM "ExamSet"
      WHERE id = "assignedExamSetId" AND status = 'ACTIVE'
    )
  );
```

---

## 3. Isolation (고립성) 위배

> "동시에 실행되는 트랜잭션이 서로 간섭하지 않아야 한다"

---

### I-01 🔴 HIGH | 로그인 실패 잠금 우회 (TASK-09)

**위치**: `examLogin` — loginFailCount 처리

**문제점** (A-01과 연계):
두 개의 동시 로그인 실패 요청이 모두 `failCount=4` 를 읽고,
둘 다 `failCount=5, status=LOCKED` 로 업데이트를 시도하지만
실제로는 카운트가 제대로 누적되지 않아 5회 초과에도 잠금이 걸리지 않을 수 있습니다.

**수정 방법**: A-01 수정과 동일 — `{ increment: 1 }` 원자적 증가 후 반환값으로 잠금 판단.

---

### I-02 🔴 HIGH | 세션 중복 생성 경쟁 조건 (TASK-10)

**위치**: `createExamSession` — TOCTOU(Time-Of-Check-Time-Of-Use)

**시나리오**:
```
T=0ms  요청1: findFirst → 없음
T=1ms  요청2: findFirst → 없음 (요청1 커밋 전)
T=2ms  요청1: create   → 세션A 생성
T=3ms  요청2: create   → 세션B 생성  ← 중복!
```

**수정 방법**: C-01과 동일한 partial unique index + DB 레벨에서 중복 생성 자체를 차단.

---

### I-03 🔴 HIGH | 시험세트 번호 중복 발급 (TASK-12)

**위치**: `generateExamSetNumber` — count() 기반 채번

**시나리오**:
```
T=0ms  요청1: count() → 5
T=1ms  요청2: count() → 5 (요청1 INSERT 전)
T=2ms  요청1: INSERT (examSetNumber="006")
T=3ms  요청2: INSERT (examSetNumber="006")  ← 중복! → DB 오류 또는 유니크 위반
```

**수정 방법**: A-06과 동일 — PostgreSQL 시퀀스 사용.

---

### I-04 🟡 MEDIUM | 어드민 회원 중복 생성 (TASK-11)

**위치**: `createExaminee` — findFirst → create

**문제 코드**:
```typescript
const existing = await prisma.examinee.findFirst({
  where: { OR: [{ loginId }, { registrationNumber }] }
});
if (existing) return res.status(409).json(...)
// ← 두 요청이 동시에 여기를 통과하면 중복 생성
await prisma.examinee.create(...)
```

**문제점**: 동시에 같은 loginId로 두 요청이 오면 둘 다 `existing = null` 을 얻고
두 번 create를 시도합니다. Prisma 스키마에 `@unique`가 있으므로 DB 오류는 발생하지만
500 에러로 처리되어 사용자에게 올바른 409 메시지가 가지 않습니다.

**수정 방법**:
```typescript
try {
  await prisma.examinee.create(...)
} catch (e: any) {
  if (e.code === "P2002") {  // Prisma unique constraint violation
    return res.status(409).json({ error: "이미 사용 중인 ID 또는 수험번호입니다." });
  }
  throw e;
}
```

---

## 4. Durability (지속성) 위배

> "커밋된 트랜잭션의 데이터는 시스템 장애 후에도 유지되어야 한다"

---

### D-01 🔴 HIGH | IBT 업로드 부분 실패 시 복구 불가 (TASK-12)

**위치**: `uploadExamSet` — 외부 API + DB 업데이트

**시나리오**:
```
1. LISTENING 스냅샷 20개 API 호출 성공
2. WRITING   스냅샷 4개 API 호출 성공
3. READING   스냅샷 50개 중 25번째에서 문제은행 API 타임아웃
→ 전체 실패 (throw) → DB 미변경 → 재시도 가능 ✅

또는:
1~2 성공 후 3도 성공
4. DB UPDATE 직전 서버 프로세스 크래시
→ 스냅샷은 메모리에만 있고 DB에 저장 안 됨 → 재시도 필요
→ 재시도는 가능하지만 문제은행 API를 다시 호출해야 함 (비효율)
```

**문제점**: 전체 실패 시 원자성은 보장되지만, 중간 스냅샷 데이터가 유실됩니다.
고부하 환경(50문항 × 상세 호출)에서 반복 실패 가능성이 높습니다.

**수정 방법** (Outbox 패턴 경량화):
```typescript
// 스냅샷을 별도 테이블에 임시 저장 후 DB 트랜잭션으로 커밋
await prisma.$transaction(async (tx) => {
  // 스냅샷은 이미 수집 완료된 상태
  await tx.examSet.update({
    where: { id, status: "DRAFT" },
    data: { status: "ACTIVE", snapshotJson: snapshot, uploadedAt: new Date() },
  });
  // 단일 트랜잭션으로 원자적 처리
});
```

---

### D-02 🟡 MEDIUM | IndexedDB ↔ 서버 동기화 실패 시 답안 유실 (TASK-02/03)

**위치**: 프론트엔드 `useAutoSave` 훅

**문제점**: 답안이 IndexedDB에 저장되었지만 서버 동기화가 계속 실패할 경우,
응시자가 시험을 완료해도 서버에는 답안이 없는 상태가 됩니다.
현재 TASK 문서에 **동기화 실패 시 처리 로직**이 명세되어 있지 않습니다.

**수정 방법** (TASK-10 및 TASK-02/03에 추가 필요):
```typescript
// useAutoSave에 추가
const MAX_RETRY = 3;
const RETRY_DELAY_MS = 2000;

async function syncWithRetry(answers: Answer[]) {
  for (let i = 0; i < MAX_RETRY; i++) {
    try {
      await api.saveAnswers(answers);
      return; // 성공
    } catch {
      if (i < MAX_RETRY - 1) await sleep(RETRY_DELAY_MS * (i + 1));
    }
  }
  // 최종 실패 → 사용자에게 경고 배너 표시
  setNetworkError(true);
}
```

---

### D-03 🟡 MEDIUM | 영역 제출 시 타이머와 서버 제출 비동기 처리 미명세 (TASK-10)

**위치**: `submitSection` — isAutoSubmitted 처리

**문제점**: 타이머 만료 시 프론트엔드가 자동 제출 API를 호출하지만,
네트워크 지연으로 API 호출이 늦어지면:
- 클라이언트는 "제출 완료" 화면을 보여주지만 서버에는 미제출
- 서버 측 타이머 강제 제출 로직이 현재 문서에 없음

**수정 방법** (TASK-10에 추가 필요):
```typescript
// 서버 측 타이머 강제 제출 Job (cron 또는 setInterval)
// 시작 시각 + 허용 시간을 초과한 IN_PROGRESS 영역을 서버가 직접 제출 처리
async function autoSubmitExpiredSections() {
  const sessions = await prisma.examSession.findMany({
    where: { status: "IN_PROGRESS" },
    include: { examSet: true }
  });
  for (const session of sessions) {
    const sections = session.sectionProgressJson as Record<string, any>;
    for (const [section, progress] of Object.entries(sections)) {
      if (!progress.startedAt || progress.submittedAt) continue;
      const elapsed = Date.now() - new Date(progress.startedAt).getTime();
      const allowedMs = getSectionDuration(session.examSet, section) * 60 * 1000 + 30_000; // 30초 여유
      if (elapsed > allowedMs) {
        await forceSubmitSection(session.id, section); // 서버 강제 제출
      }
    }
  }
}
setInterval(autoSubmitExpiredSections, 60_000); // 1분마다 체크
```

---

## 전체 수정 우선순위

| 순위 | ID | 원칙 | 설명 | 영향 |
|------|-----|------|------|------|
| 1 | A-01 + I-01 | A·I | 로그인 failCount 원자적 증가 | 보안 취약점 |
| 2 | A-04 + I-02 + C-01 | A·I·C | 세션 중복 생성 방지 (partial unique index) | 데이터 무결성 |
| 3 | A-03 + D-01 | A·D | IBT 업로드 원자성 보강 | 운영 안정성 |
| 4 | C-02 | C | CASCADE 동작 명시 | 데이터 정합성 |
| 5 | A-06 + I-03 | A·I | 시험세트 번호 시퀀스 채번 | 식별자 중복 |
| 6 | A-02 | A | S3 + DB 업로드 순서 조정 | 고아 파일 발생 |
| 7 | I-04 | I | 회원 생성 중복 오류 처리 | UX 오류 메시지 |
| 8 | D-02 | D | IndexedDB 동기화 재시도 로직 | 답안 유실 방지 |
| 9 | D-03 | D | 서버 타이머 강제 제출 Job | 응시 공정성 |
| 10 | C-03 + C-04 | C | 상태 전환 규칙 강제 | 운영 오류 방지 |
