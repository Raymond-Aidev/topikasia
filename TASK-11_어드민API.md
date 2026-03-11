# TASK-11: 어드민 API

> 연관 PRD: ADMIN-01~10, MONITOR-01~07, QUESTION-09~11
> 연관 문서: [TASK-09 백엔드 서버셋업·인증](./TASK-09_백엔드_서버셋업_인증.md) · [TASK-06 어드민 프론트엔드](./TASK-06_어드민_회원관리_시험세트배정.md) · [TASK-07 운영모니터링 프론트엔드](./TASK-07_어드민_운영모니터링.md)
> 우선순위: Phase 1 (회원·세트 관리) / Phase 2 (상세 모니터링)
> 선행 조건: TASK-09 완료 후 시작

---

## 목표

어드민이 응시자 계정을 생성·관리하고, 시험세트를 배정하며,
응시 현황을 모니터링하고 데이터를 내보낼 수 있는 서버 API를 구현한다.

---

## 1. API 전체 목록

### 회원 관리
| 메서드 | 경로 | 설명 | 역할 |
|--------|------|------|------|
| GET | /api/admin/examinees | 회원 목록 (검색·필터·페이지) | ADMIN+ |
| POST | /api/admin/examinees | 회원 생성 | ADMIN+ |
| GET | /api/admin/examinees/:id | 회원 상세 | ADMIN+ |
| PUT | /api/admin/examinees/:id | 회원 정보 수정 | ADMIN+ |
| POST | /api/admin/examinees/:id/reset-password | 비밀번호 초기화 | ADMIN+ |
| PUT | /api/admin/examinees/:id/exam-set | 시험세트 변경 | ADMIN+ |
| PUT | /api/admin/examinees/:id/status | 계정 상태 변경 (잠금/활성) | ADMIN+ |

### 시험세트 관리
| 메서드 | 경로 | 설명 | 역할 |
|--------|------|------|------|
| GET | /api/admin/exam-sets | 시험세트 목록 | ADMIN+ |
| GET | /api/admin/exam-sets/:id | 시험세트 상세 | ADMIN+ |

### 대시보드 / 모니터링
| 메서드 | 경로 | 설명 | 역할 |
|--------|------|------|------|
| GET | /api/admin/dashboard/summary | 요약 통계 카드 | ADMIN+, PROCTOR |
| GET | /api/admin/exam-sessions | 응시 내역 목록 | ADMIN+, PROCTOR |
| GET | /api/admin/exam-sessions/:id | 응시 내역 상세 | ADMIN+, PROCTOR |
| GET | /api/admin/exam-sessions/export | Excel 내보내기 | ADMIN+ |

---

## 2. 회원 목록 조회

```typescript
// GET /api/admin/examinees
// Query: page, limit, search, status, examSetId, sortBy, sortOrder

export async function listExaminees(req: Request, res: Response) {
  const {
    page = "1", limit = "20", search = "",
    status, examSetId, sortBy = "createdAt", sortOrder = "desc",
  } = req.query as Record<string, string>;

  const where: Prisma.ExamineeWhereInput = {
    ...(search && {
      OR: [
        { loginId: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { registrationNumber: { contains: search } },
      ],
    }),
    ...(status && { status: status as ExamineeStatus }),
    ...(examSetId && { assignedExamSetId: examSetId }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.examinee.findMany({
      where,
      select: {
        id: true, loginId: true, name: true, seatNumber: true,
        status: true, createdAt: true,
        assignedExamSet: { select: { id: true, examSetNumber: true, name: true } },
        examSessions: { select: { status: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.examinee.count({ where }),
  ]);

  // 응시 상태 계산
  const result = data.map(e => ({
    ...e,
    examStatus: e.examSessions[0]?.status ?? "NOT_STARTED",
  }));

  res.json({ data: result, total, page: Number(page), limit: Number(limit) });
}
```

---

## 3. 회원 생성

```typescript
// POST /api/admin/examinees
// Body: ExamineeCreateBody (multipart/form-data — 사진 파일 포함)

import multer from "multer";
import { uploadToS3 } from "../../shared/utils/s3";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const createExamineeMiddleware = upload.single("photo");

export async function createExaminee(req: Request, res: Response) {
  const {
    loginId, password, name, registrationNumber,
    seatNumber, institutionName, examRoomName, assignedExamSetId,
  } = req.body;

  // 중복 체크
  const existing = await prisma.examinee.findFirst({
    where: { OR: [{ loginId }, { registrationNumber }] },
  });
  if (existing) {
    const field = existing.loginId === loginId ? "loginId" : "registrationNumber";
    return res.status(409).json({ error: `이미 사용 중인 ${field}입니다.` });
  }

  // 시험세트 유효성 확인 (ACTIVE 상태만)
  const examSet = await prisma.examSet.findFirst({
    where: { id: assignedExamSetId, status: "ACTIVE" },
  });
  if (!examSet) {
    return res.status(400).json({ error: "유효하지 않은 시험세트입니다." });
  }

  // 사진 업로드 (S3)
  let photoUrl: string | undefined;
  if (req.file) {
    photoUrl = await uploadToS3(req.file.buffer, req.file.mimetype, `photos/${loginId}`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const examinee = await prisma.examinee.create({
    data: {
      loginId, passwordHash, name, registrationNumber,
      seatNumber: seatNumber ? Number(seatNumber) : undefined,
      photoUrl, institutionName, examRoomName,
      assignedExamSetId,
      createdById: req.admin!.sub,
    },
  });

  res.status(201).json({ examineeId: examinee.id, loginId: examinee.loginId });
}
```

---

## 4. 비밀번호 초기화

```typescript
// POST /api/admin/examinees/:id/reset-password
// 임시 비밀번호 자동 생성 후 1회 반환

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = req.params;

  const examinee = await prisma.examinee.findUnique({ where: { id } });
  if (!examinee) return res.status(404).json({ error: "회원을 찾을 수 없습니다." });

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.examinee.update({
    where: { id },
    data: { passwordHash, loginFailCount: 0, status: "ACTIVE" },
  });

  res.json({ temporaryPassword: tempPassword });
  // ※ 임시 비밀번호는 이 응답에서만 1회 노출됨 (서버에 평문 저장 없음)
}
```

---

## 5. 대시보드 요약 통계

```typescript
// GET /api/admin/dashboard/summary

export async function getDashboardSummary(req: Request, res: Response) {
  const [
    totalExaminees,
    completedSessions,
    inProgressSessions,
    examSetStats,
  ] = await prisma.$transaction([
    prisma.examinee.count({ where: { status: "ACTIVE" } }),
    prisma.examSession.count({ where: { status: "COMPLETED" } }),
    prisma.examSession.count({ where: { status: "IN_PROGRESS" } }),
    prisma.examSet.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true, examSetNumber: true, name: true,
        _count: { select: { assignedExaminees: true, examSessions: true } },
        examSessions: {
          select: { status: true },
        },
      },
    }),
  ]);

  const notStarted = totalExaminees - completedSessions - inProgressSessions;

  const examSetSummary = examSetStats.map(set => ({
    examSetId: set.id,
    examSetNumber: set.examSetNumber,
    name: set.name,
    assignedCount: set._count.assignedExaminees,
    completedCount: set.examSessions.filter(s => s.status === "COMPLETED").length,
    inProgressCount: set.examSessions.filter(s => s.status === "IN_PROGRESS").length,
  }));

  res.json({
    totalExaminees,
    completedSessions,
    inProgressSessions,
    notStarted,
    examSetSummary,
    updatedAt: new Date().toISOString(),
  });
}
```

---

## 6. 응시 내역 목록

```typescript
// GET /api/admin/exam-sessions
// Query: page, limit, examSetId, status, startDate, endDate

export async function listExamSessions(req: Request, res: Response) {
  const {
    page = "1", limit = "20", examSetId,
    status, startDate, endDate,
  } = req.query as Record<string, string>;

  const where: Prisma.ExamSessionWhereInput = {
    ...(examSetId && { examSetId }),
    ...(status && { status: status as SessionStatus }),
    ...(startDate && endDate && {
      startedAt: { gte: new Date(startDate), lte: new Date(endDate) },
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.examSession.findMany({
      where,
      include: {
        examinee: { select: { loginId: true, name: true, registrationNumber: true, seatNumber: true } },
        examSet:  { select: { examSetNumber: true, name: true } },
      },
      orderBy: { startedAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.examSession.count({ where }),
  ]);

  res.json({ data, total, page: Number(page) });
}
```

---

## 7. Excel 내보내기

```typescript
// GET /api/admin/exam-sessions/export
// Response: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

import ExcelJS from "exceljs";

export async function exportExamSessions(req: Request, res: Response) {
  const { examSetId, startDate, endDate } = req.query as Record<string, string>;

  const sessions = await prisma.examSession.findMany({
    where: {
      ...(examSetId && { examSetId }),
      ...(startDate && endDate && {
        startedAt: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    },
    include: {
      examinee: true,
      examSet: { select: { examSetNumber: true, name: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("응시 내역");

  sheet.columns = [
    { header: "수험번호",    key: "registrationNumber", width: 15 },
    { header: "성명",        key: "name",               width: 15 },
    { header: "좌석번호",    key: "seatNumber",          width: 10 },
    { header: "시험세트",    key: "examSet",             width: 25 },
    { header: "응시상태",    key: "status",              width: 12 },
    { header: "시험시작",    key: "startedAt",           width: 20 },
    { header: "듣기제출",    key: "listenSubmit",        width: 20 },
    { header: "쓰기제출",    key: "writeSubmit",         width: 20 },
    { header: "읽기제출",    key: "readSubmit",          width: 20 },
    { header: "시험완료",    key: "completedAt",         width: 20 },
    { header: "자동제출여부", key: "autoSubmit",          width: 12 },
  ];

  sessions.forEach(s => {
    const prog = s.sectionProgressJson as Record<string, any>;
    sheet.addRow({
      registrationNumber: s.examinee.registrationNumber,
      name: s.examinee.name,
      seatNumber: s.examinee.seatNumber ?? "-",
      examSet: `${s.examSet.examSetNumber}: ${s.examSet.name}`,
      status: s.status,
      startedAt: s.startedAt?.toLocaleString("ko-KR") ?? "-",
      listenSubmit: prog?.LISTENING?.submittedAt ?? "-",
      writeSubmit: prog?.WRITING?.submittedAt ?? "-",
      readSubmit: prog?.READING?.submittedAt ?? "-",
      completedAt: s.completedAt?.toLocaleString("ko-KR") ?? "-",
      autoSubmit: Object.values(prog ?? {}).some((v: any) => v.isAutoSubmitted) ? "Y" : "N",
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=exam-sessions-${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}
```

---

## 8. 라우터 (admin.router.ts)

```typescript
// src/modules/admin/admin.router.ts
import { Router } from "express";
import { adminAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/rbac.middleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
router.use(adminAuth);

// 회원 관리
router.get("/examinees",                       requireRole("ADMIN","SUPER_ADMIN"), listExaminees);
router.post("/examinees", upload.single("photo"), requireRole("ADMIN","SUPER_ADMIN"), createExaminee);
router.get("/examinees/:id",                   requireRole("ADMIN","SUPER_ADMIN"), getExaminee);
router.put("/examinees/:id",                   requireRole("ADMIN","SUPER_ADMIN"), updateExaminee);
router.post("/examinees/:id/reset-password",   requireRole("ADMIN","SUPER_ADMIN"), resetPassword);
router.put("/examinees/:id/exam-set",          requireRole("ADMIN","SUPER_ADMIN"), changeExamSet);
router.put("/examinees/:id/status",            requireRole("ADMIN","SUPER_ADMIN"), changeStatus);

// 시험세트 목록 (ACTIVE 세트 — 회원 배정 드롭다운용)
router.get("/exam-sets", requireRole("ADMIN","SUPER_ADMIN","PROCTOR"), listExamSets);
router.get("/exam-sets/:id", requireRole("ADMIN","SUPER_ADMIN","PROCTOR"), getExamSet);

// 대시보드 / 모니터링
router.get("/dashboard/summary", requireRole("ADMIN","SUPER_ADMIN","PROCTOR"), getDashboardSummary);
router.get("/exam-sessions",     requireRole("ADMIN","SUPER_ADMIN","PROCTOR"), listExamSessions);
router.get("/exam-sessions/export", requireRole("ADMIN","SUPER_ADMIN"), exportExamSessions);
router.get("/exam-sessions/:id", requireRole("ADMIN","SUPER_ADMIN","PROCTOR"), getExamSessionDetail);

export default router;
```

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 모든 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T1-03 | S3 + DB 업로드 순서 조정 — 고아 파일 방지 (A-02)

**대상**: `src/modules/admin/examinee.handler.ts` — `createExaminee` 함수

```typescript
// ❌ 기존: S3 업로드 → DB 생성 순서 → S3 성공 + DB 실패 시 고아 파일 발생
const photoUrl = await uploadToS3(file);       // 1. S3 업로드
const examinee = await prisma.examinee.create({ // 2. DB 생성 (실패 가능)
  data: { ...fields, photoUrl }
});

// ✅ 수정: DB 먼저 → S3 나중에 (DB 실패 시 S3 호출 자체를 안 함)
const examinee = await prisma.examinee.create({
  data: { ...fields, photoUrl: null }
});
if (file) {
  try {
    const photoUrl = await uploadToS3(file);
    await prisma.examinee.update({
      where: { id: examinee.id },
      data: { photoUrl }
    });
  } catch (err) {
    // 사진 업로드 실패해도 계정은 정상 생성 → 추후 재업로드 허용
    logger.warn(`Photo upload failed for examinee ${examinee.id}`, err);
  }
}
```

---

### T2-06 | 시험 중 세트 변경 차단 (신규 발굴)

**대상**: `src/modules/admin/examinee.handler.ts` — `changeExamSet` 함수 (신규 추가)

```typescript
// ✅ 신규 추가: 진행 중인 응시자의 세트 변경 시 차단
export async function changeExamSet(req: Request, res: Response) {
  const { examineeId, newExamSetId } = req.body;

  await prisma.$transaction(async (tx) => {
    // IN_PROGRESS 세션 존재 여부 먼저 확인 (트랜잭션 내)
    const activeSession = await tx.examSession.findFirst({
      where: { examineeId, status: "IN_PROGRESS" }
    });
    if (activeSession) {
      throw new AppError(
        409,
        "응시자가 현재 시험 중입니다. 세트 변경은 시험 완료 후 가능합니다."
      );
    }
    // 새 세트가 ACTIVE인지 확인
    const examSet = await tx.examSet.findFirst({
      where: { id: newExamSetId, status: "ACTIVE" }
    });
    if (!examSet) {
      throw new AppError(400, "배정 가능한 세트가 아닙니다. ACTIVE 상태의 세트만 배정할 수 있습니다.");
    }
    await tx.examinee.update({
      where: { id: examineeId },
      data: { assignedExamSetId: newExamSetId }
    });
  });

  return res.json({ message: "시험세트가 변경되었습니다." });
}
```

---

### T3-01 | 회원 생성 Unique 오류 → 409 응답 처리 (I-04)

**대상**: `src/modules/admin/examinee.handler.ts` — `createExaminee` 함수

```typescript
// ❌ 기존: P2002 오류가 500으로 응답 → 로그 오염, 운영자 원인 파악 불가
// ✅ 수정: P2002 잡아서 409 + 명확한 메시지 반환
try {
  await prisma.examinee.create({ data: { ...fields, photoUrl: null } });
} catch (e: any) {
  if (e.code === "P2002") {
    const target = e.meta?.target as string[] | undefined;
    const field = target?.includes("loginId") ? "로그인 ID" : "수험번호";
    return res.status(409).json({
      error: `이미 사용 중인 ${field}입니다.`
    });
  }
  throw e; // P2002 외 오류는 전역 에러 핸들러로 전파
}
```

---

### T3-05 | 배정 가능 세트 API — ACTIVE 필터 강제 (C-04 운영 측면)

**대상**: `src/modules/admin/examSet.handler.ts` — `getAssignableExamSets` 함수 (신규 추가)

```typescript
// ✅ 신규 추가: 배정 가능 세트 목록은 반드시 ACTIVE만 반환
export async function getAssignableExamSets(_req: Request, res: Response) {
  const sets = await prisma.examSet.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      examSetNumber: true,
      examType: true,
      _count: { select: { assignedExaminees: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ sets });
}

// 라우터에 추가
// GET /api/admin/exam-sets/assignable → getAssignableExamSets
```

## 9. 완료 조건 (Acceptance Criteria)

- [ ] `GET /api/admin/examinees`: 검색·필터·정렬·페이지네이션 동작
- [ ] `POST /api/admin/examinees`: 사진 파일 업로드 포함 회원 생성
- [ ] loginId / registrationNumber 중복 시 409 반환
- [ ] ACTIVE 상태가 아닌 시험세트 배정 시 400 반환
- [ ] `POST /api/admin/examinees/:id/reset-password`: 임시 비밀번호 1회 반환
- [ ] `GET /api/admin/dashboard/summary`: 세트별 통계 포함 반환
- [ ] `GET /api/admin/exam-sessions/export`: 유효한 .xlsx 파일 다운로드
- [ ] PROCTOR 역할: 조회만 가능, 생성·수정 불가 (403)

---

## 10. 추가 패키지

```bash
npm install exceljs multer
npm install -D @types/multer
```

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] 회원 목록 조회 (검색/필터/정렬/페이지네이션) — `server/src/modules/admin/handlers/listExaminees.ts`
- [x] 회원 생성 + 사진 S3 업로드 (T1-03 DB-first 순서) — `server/src/modules/admin/handlers/createExaminee.ts`
- [x] 회원 상세 조회 (세션 포함) — `server/src/modules/admin/handlers/getExaminee.ts`
- [x] 회원 정보 수정 — `server/src/modules/admin/handlers/updateExaminee.ts`
- [x] 비밀번호 초기화 (임시 비밀번호 1회 반환) — `server/src/modules/admin/handlers/resetPassword.ts`
- [x] 시험세트 변경 (T2-06 IN_PROGRESS 세션 차단, 409) — `server/src/modules/admin/handlers/changeExamSet.ts`
- [x] 계정 상태 변경 (잠금/활성) — `server/src/modules/admin/handlers/changeStatus.ts`
- [x] 시험세트 전체 목록 — `server/src/modules/admin/handlers/listExamSets.ts`
- [x] 시험세트 상세 — `server/src/modules/admin/handlers/getExamSet.ts`
- [x] 대시보드 요약 통계 — `server/src/modules/admin/handlers/getDashboardSummary.ts`
- [x] 응시 내역 목록 — `server/src/modules/admin/handlers/listExamSessions.ts`
- [x] 응시 내역 상세 — `server/src/modules/admin/handlers/getExamSessionDetail.ts`
- [x] Excel 내보내기 (ExcelJS) — `server/src/modules/admin/handlers/exportExamSessions.ts`
- [x] 어드민 라우터 (adminAuth + RBAC 전체 적용) — `server/src/modules/admin/admin.router.ts`

### 미완료 항목 (Phase 2)
- [ ] GET /api/admin/exam-sets/assignable — ACTIVE 전용 별도 엔드포인트 (현재 listExamSets에서 필터 처리)
- [ ] 회원 일괄 등록 (CSV/Excel 업로드)
- [ ] 응시 내역 상세 통계 (문항별 정답률)

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `src/modules/admin/admin.router.ts` | `server/src/modules/admin/admin.router.ts` | ✅ |
| `src/modules/admin/` (listExaminees) | `server/src/modules/admin/handlers/listExaminees.ts` | ✅ |
| `src/modules/admin/` (createExaminee) | `server/src/modules/admin/handlers/createExaminee.ts` | ✅ |
| `src/modules/admin/` (getExaminee) | `server/src/modules/admin/handlers/getExaminee.ts` | ✅ |
| `src/modules/admin/` (updateExaminee) | `server/src/modules/admin/handlers/updateExaminee.ts` | ✅ |
| `src/modules/admin/` (resetPassword) | `server/src/modules/admin/handlers/resetPassword.ts` | ✅ |
| `src/modules/admin/` (changeExamSet) | `server/src/modules/admin/handlers/changeExamSet.ts` | ✅ |
| `src/modules/admin/` (changeStatus) | `server/src/modules/admin/handlers/changeStatus.ts` | ✅ |
| `src/modules/admin/` (listExamSets) | `server/src/modules/admin/handlers/listExamSets.ts` | ✅ |
| `src/modules/admin/` (getExamSet) | `server/src/modules/admin/handlers/getExamSet.ts` | ✅ |
| `src/modules/admin/` (getDashboardSummary) | `server/src/modules/admin/handlers/getDashboardSummary.ts` | ✅ |
| `src/modules/admin/` (listExamSessions) | `server/src/modules/admin/handlers/listExamSessions.ts` | ✅ |
| `src/modules/admin/` (getExamSessionDetail) | `server/src/modules/admin/handlers/getExamSessionDetail.ts` | ✅ |
| `src/modules/admin/` (exportExamSessions) | `server/src/modules/admin/handlers/exportExamSessions.ts` | ✅ |

### ACID 준수 현황
- [x] T1-03: S3 + DB 업로드 순서 조정 — DB-first로 고아 파일 방지 — `createExaminee.ts`
- [x] T2-06: 시험 중 세트 변경 차단 — IN_PROGRESS 세션 확인 in 트랜잭션 — `changeExamSet.ts`
- [x] T3-01: 회원 생성 Unique 오류(P2002) → 409 응답 처리 — `createExaminee.ts`
- [x] T3-05: 배정 가능 세트 API — ACTIVE 필터 강제 — `listExamSets.ts`

### 비고
- 문서에서는 handler를 단일 파일로 기술했으나, 구현은 `handlers/` 디렉토리 아래 14개 개별 파일로 분리됨
- `GET /api/admin/exam-sets/assignable` 별도 엔드포인트는 현재 `listExamSets`의 status 필터로 대체 중
- 문서의 `getAssignableExamSets` (T3-05)는 독립 핸들러가 아닌 `listExamSets` 내 ACTIVE 필터로 구현됨
