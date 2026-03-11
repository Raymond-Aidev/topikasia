# TASK-07: 어드민 — 운영 모니터링 대시보드

> 연관 PRD: MONITOR-01~07
> 참고 화면: SCR-A02, SCR-A07, SCR-A08
> 연관 문서: [TASK-06 어드민 회원관리·시험세트배정](./TASK-06_어드민_회원관리_시험세트배정.md) · [TASK-08 문제 출제 모듈](./TASK-08_문제출제모듈.md)
> 우선순위: Phase 1 (대시보드·응시내역) / Phase 2 (실시간 모니터링)

---

## 목표

어드민이 전체 운영 현황을 한눈에 파악하고,
응시자별·세트별 응시 내역을 상세 조회·관리할 수 있는 모니터링 기능을 구현한다.

---

## 1. 대시보드 (SCR-A02)

### UI 명세

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOPIK IBT 관리자  │ 대시보드 | 회원관리 | 시험세트 | 응시내역 | 실시간 │ 로그아웃 │
├─────────────────────────────────────────────────────────────────────┤
│  마지막 갱신: 14:32:05  [🔄 새로고침]                               │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  전체 회원   │ │  응시 완료   │ │  진행 중    │ │   미응시    │ │
│  │    150 명   │ │    87 명    │ │    12 명    │ │    51 명    │ │
│  │  ── 기준선  │ │  ▲ 58.0%   │ │  🟢 실시간  │ │  ▽ 34.0%   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                     │
│  ┌──── 시험세트별 현황 ─────────────────────────────────────────┐  │
│  │  세트명              유형      배정  완료  진행  미응시        │  │
│  │  2026년 1회 II 세트A  TOPIK II  87   51   12    24           │  │
│  │  2026년 1회 I  세트B  TOPIK I   63   36    0    27           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──── 오늘 응시 현황 (시간대별) ─────────────────────────────┐    │
│  │  09 10 11 12 13 14 15 16 17                                 │    │
│  │   █  ██ ██  █  ▌                                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 컴포넌트: AdminDashboard
```typescript
// 데이터 자동 갱신
useEffect(() => {
  fetchDashboardStats();
  const interval = setInterval(fetchDashboardStats, 30_000); // 30초 polling
  return () => clearInterval(interval);
}, []);
```

### API
```
GET /api/admin/dashboard/stats
Response: {
  totalExaminees: number,
  completedCount: number,
  inProgressCount: number,
  notStartedCount: number,
  examSetStats: {
    examSetId: string,
    name: string,
    examType: string,
    assigned: number,
    completed: number,
    inProgress: number,
    notStarted: number
  }[],
  hourlyActivity: { hour: number, count: number }[]
}
```

---

## 2. 응시 내역 (SCR-A07)

### UI 명세

```
┌─────────────────────────────────────────────────────────────────────┐
│  응시 내역                                         [📥 Excel 내보내기] │
├─────────────────────────────────────────────────────────────────────┤
│  기간: [2026-03-01] ~ [2026-03-10]  세트: [전체▼]  상태: [전체▼]  [검색] │
├──────┬──────────┬────────┬────────────┬──────────┬──────────┬──────┤
│ ID   │  성명    │  세트  │  시작 시간  │  종료 시간 │  상태    │ 상세 │
├──────┼──────────┼────────┼────────────┼──────────┼──────────┼──────┤
│ u001 │ 김영희   │ 세트A  │ 14:00:00   │ 17:05:00 │ ✅ 완료  │ [보기]│
│ u002 │ 이민수   │ 세트A  │ 14:00:00   │ (진행 중) │ 🔵 진행  │ [보기]│
│ u003 │ TOPIK KIM│ 세트B  │ —          │ —        │ ⚪ 미응시 │ [보기]│
└──────┴──────────┴────────┴────────────┴──────────┴──────────┴──────┘
│  총 150건  |  1 2 3 ... 8  (페이지네이션, 20건/페이지)               │
└─────────────────────────────────────────────────────────────────────┘
```

### 응시 상세 모달

```
┌──── 응시 상세: 김영희 (u001) ─────────────────────────────────────┐
│                                                                   │
│  시험세트: 2026년 1회 TOPIK II 세트A                               │
│  응시 시작: 2026-03-10 14:00:12                                    │
│                                                                   │
│  영역별 진행 상황                                                  │
│  ┌─────────┬────────────────┬───────────────┬────────┐          │
│  │  영역    │  시작 시간     │  제출 시간     │  상태  │          │
│  ├─────────┼────────────────┼───────────────┼────────┤          │
│  │  듣기    │ 14:00:12       │ 14:38:44      │ 제출   │          │
│  │  쓰기    │ 15:05:00       │ 15:53:21      │ 제출   │          │
│  │  읽기    │ 16:05:00       │ 17:04:58      │ 자동제출│          │
│  └─────────┴────────────────┴───────────────┴────────┘          │
│                                                                   │
│  문항별 답안 보기  [펼치기 ▼]                                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 구현 요구사항
- 날짜 범위 선택 (DateRangePicker)
- 세트별, 상태별 필터 (복수 선택 가능)
- 실시간 상태 갱신: 진행 중인 응시자는 1분 polling
- Excel 내보내기: ID, 성명, 세트, 시작/종료 시간, 영역별 제출 시간, 상태

### API
```
GET /api/admin/exam-sessions
Query: {
  page, limit,
  startDate, endDate,       // YYYY-MM-DD
  examSetId,
  status: "IN_PROGRESS" | "COMPLETED" | "NOT_STARTED",
  search                    // ID 또는 성명
}
Response: {
  data: ExamSessionSummary[],
  total: number
}

GET /api/admin/exam-sessions/:sessionId
Response: ExamSessionDetail (영역별 타임스탬프 + 문항별 답안)

GET /api/admin/exam-sessions/export
Query: (동일 필터)
Response: Excel 파일 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

---

## 3. 실시간 모니터링 (SCR-A08) — Phase 2

### UI 명세

```
┌─────────────────────────────────────────────────────────────────────┐
│  실시간 모니터링  (🟢 12명 응시 중)                    [전체 종료]  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ 좌석 1  김영희   🟢 읽기 진행 중  남은시간: 00:32:15          ││
│  │ 좌석 2  이민수   🟢 쓰기 진행 중  남은시간: 00:18:44          ││
│  │ 좌석 3  박지연   🔵 제출 완료                                  ││
│  │ 좌석 4  TOPIK   🔴 오프라인 (마지막 접속: 14:22:10)           ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [좌석 1 시험 강제 종료]  [좌석 4 세션 초기화]                      │
└─────────────────────────────────────────────────────────────────────┘
```

### WebSocket 구현
```typescript
// 감독관 대시보드 WebSocket 연결
const ws = new WebSocket("wss://api.topik-ibt.kr/ws/proctor");

// 수신 이벤트
ws.on("examinee:status_update", (data: {
  examineeId: string,
  seatNumber: number,
  currentSection: string,
  remainingSeconds: number,
  status: "ONLINE" | "OFFLINE" | "SUBMITTED"
}) => {
  updateExamineeStatus(data);
});

// 송신 이벤트 (감독관 → 서버 → 응시자)
ws.send(JSON.stringify({
  type: "control:end_exam",
  examineeId: "string"        // 특정 응시자 시험 종료
}));

ws.send(JSON.stringify({
  type: "control:allow_exit", // 모든 응시자 시험 종료 버튼 활성화
  examSetId: "string"
}));
```

### 감독관 제어 기능
- 개별 응시자 강제 종료 (확인 모달 후 실행)
- 전체 응시자 시험 종료 버튼 활성화
- 오프라인 응시자 세션 초기화 (재접속 허용)
- 실시간 타이머 동기화 (서버 기준 시간)

---

## 4. 엑셀 내보내기 명세

### 내보내기 컬럼
| 컬럼명 | 설명 |
|-------|------|
| 응시자 ID | 로그인 ID |
| 성명 | 응시자 이름 |
| 수험번호 | 9자리 번호 |
| 시험세트 | 세트 이름 |
| 응시 상태 | 완료/진행 중/미응시 |
| 시험 시작 | YYYY-MM-DD HH:MM:SS |
| 듣기 제출 | HH:MM:SS |
| 쓰기 제출 | HH:MM:SS |
| 읽기 제출 | HH:MM:SS |
| 자동 제출 여부 | 예/아니오 |
| 시험 종료 | YYYY-MM-DD HH:MM:SS |

### 구현
```typescript
// SheetJS 사용
import * as XLSX from "xlsx";

function exportToExcel(sessions: ExamSessionSummary[]) {
  const rows = sessions.map(s => ({
    "응시자 ID": s.loginId,
    "성명": s.name,
    "수험번호": s.registrationNumber,
    "시험세트": s.examSetName,
    "응시 상태": statusLabel[s.status],
    "시험 시작": formatDateTime(s.startedAt),
    "듣기 제출": s.listeningSubmittedAt || "-",
    "쓰기 제출": s.writingSubmittedAt || "-",
    "읽기 제출": s.readingSubmittedAt || "-",
    "자동 제출": s.isAutoSubmitted ? "예" : "아니오",
    "시험 종료": formatDateTime(s.completedAt),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "응시내역");
  XLSX.writeFile(wb, `응시내역_${format(new Date(), "yyyyMMdd")}.xlsx`);
}
```

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T3-06 | 감독관 세션 강제 종료 UI + WebSocket 수신 처리 (Phase 2)

**대상**: `client/src/admin/components/ProctorMonitorPanel.tsx` (실시간 모니터링)

#### 감독관 강제 종료 버튼
```typescript
// ✅ 감독관 세션 강제 종료 버튼 (실시간 모니터링 화면 응시자 카드에 표시)
const handleForceTerminate = async (sessionId: string) => {
  const confirmed = await Modal.confirm({
    title: "세션 강제 종료",
    content: "이 응시자의 시험을 즉시 종료합니다. 계속하시겠습니까?",
    okText: "종료",
    okType: "danger",
    cancelText: "취소"
  });
  if (!confirmed) return;

  const reason = await promptReason(); // 종료 사유 입력 모달
  try {
    await adminApi.post(`/admin/sessions/${sessionId}/terminate`, { reason });
    toast.success("세션이 종료되었습니다.");
  } catch (err: any) {
    if (err.response?.status === 404) {
      toast.warning("이미 종료된 세션입니다.");
    } else {
      toast.error("세션 종료 중 오류가 발생했습니다.");
    }
  }
};
```

#### 응시자 화면 WebSocket 수신 처리
```typescript
// ✅ 응시자 시험 화면에서 sessionTerminated 이벤트 수신 처리
// client/src/exam/hooks/useSessionSocket.ts
useEffect(() => {
  socket.on("sessionTerminated", ({ reason, message }) => {
    // 진행 중인 모든 상태 초기화
    useExamStore.getState().clearSession();
    // 강제 종료 안내 화면으로 이동
    navigate("/exam/terminated", { state: { reason, message } });
  });
  return () => { socket.off("sessionTerminated"); };
}, [socket]);
```

#### 강제 종료 안내 화면 (신규)
```typescript
// client/src/exam/pages/SessionTerminatedScreen.tsx
export function SessionTerminatedScreen() {
  const { reason } = useLocation().state as { reason: string };
  return (
    <div className="terminated-screen">
      <h1>시험이 종료되었습니다</h1>
      <p>감독관에 의해 시험이 종료되었습니다.</p>
      <p className="reason">사유: {reason}</p>
      <p>자리를 이동하지 말고 감독관의 안내를 기다려 주세요.</p>
    </div>
  );
}
// 라우터에 추가: /exam/terminated → SessionTerminatedScreen
```

---

### T3-04 | 감사 로그 — 강제 종료 이력 조회 UI (운영 지원)

**대상**: `client/src/admin/pages/ExamineeDetailPage.tsx` (응시 이력 탭)

```typescript
// ✅ 응시자 상세 > 응시 이력 탭에 자동 제출 / 강제 종료 이력 표시
// AuditLog 조회 API: GET /api/admin/examinees/:id/audit-logs
const { data: auditLogs } = useQuery({
  queryKey: ["audit-logs", examineeId],
  queryFn: () => adminApi.get(`/examinees/${examineeId}/audit-logs`).then(r => r.data)
});

// 표시 예: "2026-03-10 14:32 — 듣기 영역 자동 제출 (타이머 만료)"
//          "2026-03-10 14:45 — 세션 강제 종료 (부정행위 의심)"
```

## 5. 완료 조건 (Acceptance Criteria)

**Phase 1**:
- [ ] 대시보드: 요약 카드 4개 (전체/완료/진행/미응시) 표시
- [ ] 대시보드: 시험세트별 현황 테이블
- [ ] 대시보드: 30초 자동 갱신
- [ ] 응시 내역: 날짜·세트·상태 필터링
- [ ] 응시 내역: 응시 상세 모달 (영역별 타임스탬프)
- [ ] 응시 내역: Excel 내보내기
- [ ] 페이지네이션 (20건/페이지)

**Phase 2**:
- [ ] 실시간 모니터링: WebSocket 연결 및 응시자 상태 실시간 표시
- [ ] 감독관 제어: 개별/전체 시험 종료
- [ ] 오프라인 감지 (30초 이상 heartbeat 없을 시)

---

## 6. 파일 구조

```
src/admin/
├── pages/
│   ├── DashboardPage.tsx
│   ├── ExamSessionListPage.tsx
│   └── RealtimeMonitorPage.tsx
├── components/
│   ├── StatCard.tsx
│   ├── ExamSetStatTable.tsx
│   ├── HourlyChart.tsx
│   ├── ExamSessionTable.tsx
│   ├── ExamSessionDetailModal.tsx
│   └── RealtimeExamineeCard.tsx
├── hooks/
│   ├── useDashboardPolling.ts
│   └── useProctorWebSocket.ts
└── utils/
    └── exportExcel.ts
```

---

## 7. 시험 예정 일시 설정 (SYNC-01) — 동시시작 기능

### 개요

어드민이 시험세트 설정 화면에서 `scheduledStartAt`(시험 예정 일시)을 입력하면,
해당 일시 T-10초에 서버가 WebSocket으로 카운트다운을 브로드캐스트하여 모든 응시자가 동시에 시험을 시작할 수 있다.

> 이 기능은 TASK-11 (어드민 API) 및 TASK-12 (WebSocket)와 연동된다.

---

### 7.1 시험 예정 일시 설정 UI

시험세트 관리 화면(SCR-A03~A04) 내 시험 설정 폼에 아래 필드를 추가한다.

```typescript
// client/src/admin/components/ExamSetScheduleInput.tsx

import React from "react";

interface Props {
  value: string; // ISO8601 datetime-local 형식: "2026-06-15T09:00"
  onChange: (value: string) => void;
}

/**
 * 시험 예정 일시 입력 컴포넌트
 * - 미설정 시: 감독관이 수동으로 시험을 시작하는 기존 방식 유지
 * - 설정 시: 해당 일시 T-10초에 자동 카운트다운 → 동시 시작
 */
const ExamSetScheduleInput: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="form-group" style={{ marginBottom: "1.5rem" }}>
      <label
        htmlFor="scheduledStartAt"
        style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}
      >
        시험 예정 일시
        <span
          style={{
            marginLeft: "8px",
            fontSize: "0.8rem",
            color: "#888",
            fontWeight: 400,
          }}
        >
          (미설정 시 감독관 수동 시작)
        </span>
      </label>

      <input
        id="scheduledStartAt"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 12px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "1rem",
          width: "280px",
        }}
      />

      {value && (
        <p style={{ marginTop: "0.5rem", color: "#003087", fontSize: "0.9rem" }}>
          ⏰ 설정된 시험 시작: {new Date(value).toLocaleString("ko-KR")}
          <br />
          <span style={{ color: "#666", fontSize: "0.8rem" }}>
            해당 시각 10초 전부터 응시자 화면에 카운트다운이 표시됩니다.
          </span>
        </p>
      )}

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            marginTop: "0.5rem",
            padding: "4px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem",
            color: "#666",
          }}
        >
          일시 설정 초기화 (수동 시작으로 전환)
        </button>
      )}
    </div>
  );
};

export default ExamSetScheduleInput;
```

---

### 7.2 시험세트 생성/수정 폼 통합 (ExamSetFormPage)

```typescript
// client/src/admin/pages/ExamSetFormPage.tsx (시험세트 생성/편집 폼)
// 기존 폼에 아래 항목 추가:

const [scheduledStartAt, setScheduledStartAt] = useState<string>("");

// 폼 제출 시 scheduledStartAt 포함
const handleSubmit = async () => {
  await api.put(`/api/question-module/exam-sets/${examSetId}`, {
    name,
    examType,
    sections,
    // ✅ 동시시작 일시 추가
    scheduledStartAt: scheduledStartAt || null, // 빈 문자열 → null (수동 시작)
  });
};

// 폼 렌더링에 추가
<ExamSetScheduleInput
  value={scheduledStartAt}
  onChange={setScheduledStartAt}
/>
```

---

### 7.3 API 명세

**PUT /api/question-module/exam-sets/:id**
- 기존 엔드포인트에 `scheduledStartAt` 필드 추가

```typescript
// Request Body
{
  name?: string;
  examType?: "TOPIK_I" | "TOPIK_II";
  sections?: object;
  scheduledStartAt?: string | null; // ISO8601 or null
}

// Response
{
  examSetId: string;
  scheduledStartAt: string | null;
  message: "업데이트 완료"
}
```

---

### 7.4 어드민 실시간 모니터링 — 시험 시작 상태 표시

기존 실시간 모니터링 화면(SCR-A08)에 시험 시작 상태를 추가로 표시한다.

```typescript
// client/src/admin/components/ExamSetStatusBadge.tsx
interface Props {
  scheduledStartAt: string | null;
  status: "DRAFT" | "UPLOADED" | "ACTIVE" | "ARCHIVED";
}

const ExamSetStatusBadge: React.FC<Props> = ({ scheduledStartAt, status }) => {
  const now = new Date();
  const startAt = scheduledStartAt ? new Date(scheduledStartAt) : null;
  const isStarted = startAt && now >= startAt;
  const isCountingDown = startAt && !isStarted && (startAt.getTime() - now.getTime()) <= 60000;

  if (isStarted) {
    return <span className="badge badge-danger">시험 진행 중 (진입 차단)</span>;
  }
  if (isCountingDown) {
    const secsLeft = Math.ceil((startAt!.getTime() - now.getTime()) / 1000);
    return <span className="badge badge-warning">시작 임박 ({secsLeft}초 후)</span>;
  }
  if (startAt) {
    return (
      <span className="badge badge-info">
        {startAt.toLocaleString("ko-KR")} 예정
      </span>
    );
  }
  return <span className="badge badge-secondary">수동 시작</span>;
};
```

---

### 7.5 완료 조건 (동시시작 어드민 UI)

- [ ] 시험세트 생성/수정 폼에 `시험 예정 일시` datetime-local 입력 필드 추가
- [ ] 미설정 시 "수동 시작" 모드로 동작 (기존 방식 유지)
- [ ] 설정된 일시를 한국어 형식으로 표시 및 초기화 버튼 제공
- [ ] PUT /api/question-module/exam-sets/:id 에 `scheduledStartAt` 파라미터 전달
- [ ] 실시간 모니터링 화면에 시험 시작 상태 뱃지(시작 임박/진행 중/예정) 표시

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] 대시보드 — 4개 통계 카드 (전체/완료/진행/미응시), 세트별 현황 테이블, 30초 polling, 새로고침 — `admin/pages/DashboardPage.tsx`
- [x] 대시보드 자동 갱신 Hook — 30초 polling, refresh() 수동 호출 — `admin/hooks/useDashboardPolling.ts`
- [x] 응시 내역 — 날짜범위/세트/상태 필터, 페이지네이션 (20건/페이지), Excel 내보내기 — `admin/pages/ExamSessionListPage.tsx`
- [x] 응시 상세 모달 — 영역별 진행 상황 (시작/제출 시간), 문항별 답안 보기 — `admin/components/ExamSessionDetailModal.tsx`
- [x] 시험 예정 일시 설정 — datetime-local 입력, scheduledStartAt 설정/초기화 — `admin/components/ExamSetScheduleInput.tsx`
- [x] 시험 시작 상태 배지 — 예정/시작 임박/진행 중/수동 시작 표시 — `admin/components/ExamSetStatusBadge.tsx`

### 미완료 항목 (Phase 2)
- [ ] 실시간 모니터링 화면 (SCR-A08) — WebSocket 연결, 응시자 상태 실시간 표시
- [ ] 실시간 모니터링 페이지 — `admin/pages/RealtimeMonitorPage.tsx`
- [ ] 감독관 모니터링 패널 — ProctorMonitorPanel (T3-06 세션 강제종료)
- [ ] 실시간 응시자 카드 — RealtimeExamineeCard
- [ ] 감독관 WebSocket Hook — useProctorWebSocket.ts
- [ ] 감사 로그 조회 UI — audit-logs API 연동 (T3-04)
- [ ] 오프라인 감지 (30초 이상 heartbeat 없을 시)
- [ ] 감독관 제어: 개별/전체 시험 종료
- [ ] StatCard, ExamSetStatTable, HourlyChart 별도 컴포넌트 분리
- [ ] exportExcel.ts 유틸 분리
- [ ] SessionTerminatedScreen.tsx (감독관 강제 종료 시 응시자 안내 화면)

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `admin/pages/DashboardPage.tsx` | `admin/pages/DashboardPage.tsx` | ✅ |
| `admin/pages/ExamSessionListPage.tsx` | `admin/pages/ExamSessionListPage.tsx` | ✅ |
| `admin/pages/RealtimeMonitorPage.tsx` | (미구현) | ⏳ |
| `admin/components/StatCard.tsx` | (DashboardPage 내부 인라인) | ⏳ |
| `admin/components/ExamSetStatTable.tsx` | (DashboardPage 내부 인라인) | ⏳ |
| `admin/components/HourlyChart.tsx` | (DashboardPage 내부 인라인) | ⏳ |
| `admin/components/ExamSessionTable.tsx` | (ExamSessionListPage 내부 인라인) | ⏳ |
| `admin/components/ExamSessionDetailModal.tsx` | `admin/components/ExamSessionDetailModal.tsx` | ✅ |
| `admin/components/RealtimeExamineeCard.tsx` | (미구현) | ⏳ |
| `admin/components/ExamSetScheduleInput.tsx` | `admin/components/ExamSetScheduleInput.tsx` | ✅ |
| `admin/components/ExamSetStatusBadge.tsx` | `admin/components/ExamSetStatusBadge.tsx` | ✅ |
| `admin/hooks/useDashboardPolling.ts` | `admin/hooks/useDashboardPolling.ts` | ✅ |
| `admin/hooks/useProctorWebSocket.ts` | (미구현) | ⏳ |
| `admin/utils/exportExcel.ts` | (ExamSessionListPage 내부 인라인) | ⏳ |
| `admin/components/ProctorMonitorPanel.tsx` | (미구현) | ⏳ |
| `exam/pages/SessionTerminatedScreen.tsx` | (미구현) | ⏳ |
| `exam/hooks/useSessionSocket.ts` | (미구현) | ⏳ |

### 비고
- Phase 1 항목(대시보드, 응시 내역, Excel 내보내기)은 모두 구현 완료
- Phase 2 실시간 모니터링(WebSocket 기반)은 전체 미구현 상태 — RealtimeMonitorPage, ProctorMonitorPanel, useProctorWebSocket, RealtimeExamineeCard 모두 미생성
- 문서에서 별도 컴포넌트로 명시된 StatCard, ExamSetStatTable, HourlyChart, ExamSessionTable은 각 페이지 내부에 인라인 구현
- exportExcel.ts 유틸도 ExamSessionListPage 내부에 인라인 구현
- T3-06(감독관 강제 종료) 및 T3-04(감사 로그)는 Phase 2로 미구현
- SYNC-01 동시시작 관련 UI(ExamSetScheduleInput, ExamSetStatusBadge)는 구현 완료
