# TASK-01: 공통 UI 컴포넌트 + 로그인/대기 화면 구현

> 연관 PRD: AUTH-01~05, WAIT-01~06, UI-01~06
> 참고 화면: SCR-01, SCR-02, SCR-03, SCR-04, SCR-05
> 연관 문서: [TASK-06 어드민 회원관리·시험세트배정](./TASK-06_어드민_회원관리_시험세트배정.md) — 회원 생성·세트 배정
> 연관 문서: [TASK-08 문제 출제 모듈](./TASK-08_문제출제모듈.md) — 시험세트 구성·활성화
> 우선순위: Phase 1 (MVP 필수)

---

## 목표

모든 화면에서 공통으로 사용되는 UI 컴포넌트(헤더, 타이머, 내비게이션)와
시험 시작 전 흐름(로그인 → 수험자 확인 → 유형 선택 → 대기실)을 구현한다.

---

## 1. 공통 레이아웃 컴포넌트

### 1-1. ExamHeader 컴포넌트

**위치**: 화면 최상단 고정 (position: fixed top)
**배경색**: `#1565C0` (파란색)
**높이**: 56px

**구성 요소**:
```
[좌측] 수험번호 표시        [중앙] 시험명        [우측] 타이머
 001007155            한국어능력시험(TOPIK) IBT - TOPIK II    ⏱ 남은 시험 시간 01:24:36
```

**Props 명세**:
```typescript
interface ExamHeaderProps {
  registrationNumber: string;       // 수험번호
  examTitle: string;                // "TOPIK I" | "TOPIK II"
  timerMode: "countdown" | "clock"; // 대기 중=clock, 시험 중=countdown
  remainingSeconds?: number;        // 카운트다운 초 (timerMode=countdown 시)
  onTimerExpire?: () => void;       // 시간 만료 콜백
}
```

**타이머 표시 규칙**:
- 시험 진행 중: "남은 시험 시간 HH:MM:SS" (빨간색으로 전환 — 5분 이하)
- 대기 화면: "현재시간 HH:MM:SS" (실시간 시계)

---

### 1-2. ExamNavigation 컴포넌트

**위치**: 화면 하단 고정
**높이**: 64px
**배경**: 흰색, 상단 border

**구성 요소**:
```
[< 이전]         [⊞ 전체 문제]          [다음 >]
(좌측)           (중앙, 읽기만 표시)      (우측)
```

**Props 명세**:
```typescript
interface ExamNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  onShowAllQuestions?: () => void;  // 읽기 영역만 제공
  showAllQuestionsButton: boolean;
  prevDisabled?: boolean;
  nextLabel?: string;               // "다음" | "답안 제출"
}
```

---

### 1-3. ExamineeCard 컴포넌트

답안 제출 화면 및 대기 화면에서 공통 사용

**구성**:
```
┌────────────────────────────────────────────────────────┐
│  ◎ 좌석 1      [사진]  수험번호: 001007155              │
│                        성명: TOPIK KIM    서명: ___     │
└────────────────────────────────────────────────────────┘
```

**Props**:
```typescript
interface ExamineeCardProps {
  seatNumber: number;
  photoUrl: string;
  registrationNumber: string;
  name: string;
  institutionName: string;   // "국립국제교육원"
  examRoomName: string;      // "제1시험실"
  showSignature?: boolean;   // 답안 제출 화면에서만 true
}
```

---

## 2. 로그인 화면 (SCR-01)

### UI 명세
```
┌──────────────────────────────────────┐
│         TOPIK IBT 로고               │
│                                      │
│    수험번호  [___________________]   │
│    비밀번호  [___________________]   │
│                                      │
│         [   로그인   ]               │
└──────────────────────────────────────┘
```

### 구현 요구사항
- 수험번호: 숫자 9자리 입력 (포맷: 000000000)
- 비밀번호: 마스킹 처리 (type="password")
- 로그인 버튼: 두 필드 모두 입력 시 활성화
- 오류 처리:
  - 잘못된 수험번호/비밀번호: "수험번호 또는 비밀번호가 올바르지 않습니다." 인라인 에러 표시
  - 5회 연속 실패: "계정이 잠금되었습니다. 시험장 관리자에게 문의하세요." 표시

### API
```
POST /api/exam-auth/login
Body: { registrationNumber: string, password: string }
Response: { token: string, examineeInfo: ExamineeInfo }
```

### 완료 조건
- [x] 수험번호/비밀번호 입력 및 로그인 가능
- [x] 오류 메시지 표시
- [x] 5회 실패 잠금 처리
- [x] 로그인 성공 시 수험자 확인 화면으로 이동

---

## 3. 수험자 확인 화면 (SCR-02)

### UI 명세
```
┌──────────────────────────────────────────────┐
│  [사진]   수험번호: 001007155                  │
│           성명: TOPIK KIM                    │
│           시험 유형: TOPIK II                 │
│                                              │
│  본인이 맞으면 아래에서 시험을 선택하세요.       │
│                                              │
│  [TOPIK I 체험]     [TOPIK II 체험]           │
└──────────────────────────────────────────────┘
```

### 구현 요구사항
- 서버에서 가져온 응시자 사진을 원형 프로필 이미지로 표시
- 수험번호, 성명 표시
- 시험 유형 선택 버튼 2개 제공
- 선택 시 해당 시험 유형 세션 저장 후 대기실로 이동

### 완료 조건
- [x] 응시자 정보 표시
- [x] 시험 유형 선택 (TOPIK I / TOPIK II)
- [x] 선택 후 대기실 화면으로 이동

---

## 4. 시험 대기실 (SCR-04)

### UI 명세
```
┌─────────────────────────────────────────────────────────────────┐
│  수험번호: 001007155  │ 한국어능력시험(TOPIK) IBT - TOPIK II │ 현재시간 14:00:00 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  국립국제교육원 | 제1시험실                                        │
│                                                                 │
│   ◎ 좌석 1  │ [사진] │ 수험번호: 001007155  │ 성명: TOPIK KIM  │
│                                                                 │
│                  ⏱  남은 시간  00:00:10  ← 빨간색              │
│                                                                 │
│  ┌──────────┬─────────────────┐                                 │
│  │  영역    │  시험 시작 시간  │                                 │
│  ├──────────┼─────────────────┤                                 │
│  │  듣기    │  14:00:00       │                                 │
│  │  쓰기    │  15:05:00       │                                 │
│  │  읽기    │  16:05:00       │                                 │
│  └──────────┴─────────────────┘                                 │
│                                                                 │
│        시험이 자동으로 시작됩니다. 자리에 앉아 대기 하십시오.       │
└─────────────────────────────────────────────────────────────────┘
```

### 구현 요구사항
- 대기 화면에서 타이머는 현재 시각 표시 (시계 모드)
- 카운트다운은 시험 시작까지 남은 시간 (별도 섹션, 빨간 숫자)
- 영역별 시작 시간 테이블 (TOPIK I: 듣기/읽기, TOPIK II: 듣기/쓰기/읽기)
- 시험 시작 시각 도달 시 자동으로 영역 시작 대기 화면으로 전환
- 주황색 테두리 박스 안에 전체 컨텐츠 배치

### 영역 시작 대기 (SCR-05)
- 대기실과 동일한 레이아웃
- 헤더 변경: "쓰기 시작 대기", "읽기 시작 대기" 등
- 남은 시간: 해당 영역까지 남은 시간
- 영역 시간 테이블에 현재 대기 중인 영역만 표시 (또는 전체 표시)
- 안내 툴팁: "쓰기 영역 시작 대기 화면입니다. 시험 시간이 되면 쓰기 시험이 자동으로 시작됩니다."

### API
```
GET /api/exam/session
Response: {
  examineeInfo: ExamineeInfo,
  examSchedule: { section: string, startTime: string }[],
  examStatus: "WAITING" | "IN_PROGRESS" | "COMPLETED"
}

WS /ws/exam-control
// 감독관 → 클라이언트: 시험 시작/종료 제어 이벤트 수신
```

### 완료 조건
- [x] 수험자 정보 및 좌석번호 표시
- [x] 현재 시각 및 시험 시작까지 남은 시간 카운트다운 표시
- [x] 영역별 시작 시간 테이블 표시
- [x] 시작 시각 도달 시 자동 전환
- [x] WebSocket으로 감독관 제어 이벤트 수신

---

## 5. 상태 관리 설계

```typescript
// examStore.ts (Zustand)
interface ExamState {
  // 응시자 정보
  examinee: ExamineeInfo | null;
  examType: "TOPIK_I" | "TOPIK_II" | null;
  
  // 시험 진행 상태
  currentSection: "LISTENING" | "WRITING" | "READING" | null;
  examPhase: "LOGIN" | "WAITING" | "IN_PROGRESS" | "SUBMITTING" | "DONE";
  
  // 타이머
  sectionRemainingSeconds: number;
  
  // 액션
  login: (info: ExamineeInfo) => void;
  selectExamType: (type: string) => void;
  startSection: (section: string) => void;
  tickTimer: () => void;
}
```

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T3-03 (공통) | Zustand examStore — hasNetworkError 상태 추가 (D-02 연계)

**대상**: `client/src/store/examStore.ts`

TASK-02/03/04/05의 `NetworkStatusBanner` 컴포넌트가 참조하는
`hasNetworkError` 상태를 examStore에 반드시 포함해야 합니다.

```typescript
// client/src/store/examStore.ts
import { create } from "zustand";

interface ExamState {
  // 기존 응시자 상태
  examinee: Examinee | null;
  currentSession: ExamSession | null;
  currentSection: SectionType | null;
  answers: Record<string, AnswerValue>;

  // ✅ T3-03 추가: 네트워크 동기화 오류 상태
  hasNetworkError: boolean;

  // Actions
  setExaminee: (e: Examinee | null) => void;
  setSession: (s: ExamSession | null) => void;
  setAnswer: (questionCode: string, value: AnswerValue) => void;
  setNetworkError: (v: boolean) => void;  // ✅ 추가
}

export const useExamStore = create<ExamState>((set) => ({
  examinee: null,
  currentSession: null,
  currentSection: null,
  answers: {},
  hasNetworkError: false,        // ✅ 초기값 false

  setExaminee: (e) => set({ examinee: e }),
  setSession: (s) => set({ currentSession: s }),
  setAnswer: (code, value) =>
    set((state) => ({ answers: { ...state.answers, [code]: value } })),
  setNetworkError: (v) => set({ hasNetworkError: v }),  // ✅ 추가
}));
```

## 6. 파일 구조

```
src/
├── components/
│   ├── common/
│   │   ├── ExamHeader.tsx
│   │   ├── ExamNavigation.tsx
│   │   ├── ExamineeCard.tsx
│   │   └── Timer.tsx
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── ExamineeVerifyScreen.tsx
│       ├── ExamTypeSelectScreen.tsx
│       ├── WaitingRoomScreen.tsx
│       └── SectionWaitingScreen.tsx
├── stores/
│   └── examStore.ts
├── api/
│   └── authApi.ts
└── types/
    └── exam.types.ts
```


---

## 7. 동시시작 기능 구현 (SYNC-01~08, SCR-W01~W02)

### 개요

어드민이 `scheduledStartAt`을 설정하면, 서버가 T-10초에 WebSocket으로 카운트다운 이벤트를 브로드캐스트하고 모든 대기 중인 응시자가 동시에 시험을 시작한다. 시험 시작 후 접속하는 응시자는 진입이 차단된다.

---

### 7.1 WaitingRoomScreen 업데이트 — WebSocket 카운트다운 구독

```typescript
// client/src/components/screens/WaitingRoomScreen.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useExamStore } from "../../stores/examStore";
import CountdownOverlay from "../common/CountdownOverlay";

const WaitingRoomScreen: React.FC = () => {
  const navigate = useNavigate();
  const { examinee, assignedExamSet } = useExamStore();
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null); // null=표시 안 함
  const [socketRef, setSocketRef] = useState<Socket | null>(null);

  useEffect(() => {
    if (!examinee) return;

    // /exam 네임스페이스 WebSocket 연결
    const socket = io(`${import.meta.env.VITE_API_URL}/exam`, {
      auth: { token: localStorage.getItem("examToken") },
    });

    socket.on("connect", () => {
      // 배정된 시험세트 룸 구독 (서버가 examSetId 기반 룸에 브로드캐스트)
      if (assignedExamSet?.examSetId) {
        socket.emit("waiting:join", { examSetId: assignedExamSet.examSetId });
      }
    });

    // ── 카운트다운 이벤트 수신 (T-10초부터) ──────────────────
    socket.on("exam:countdown", ({ seconds }: { seconds: number }) => {
      setCountdownSeconds(seconds);
    });

    // ── 시험 시작 이벤트 수신 (T=0초) ────────────────────────
    socket.on("exam:start", () => {
      setCountdownSeconds(0);
      // 300ms 딜레이 후 시험 시작 처리 (카운트다운 "시작!" 표시 후)
      setTimeout(() => {
        handleStartExam();
      }, 300);
    });

    setSocketRef(socket);

    return () => {
      socket.disconnect();
    };
  }, [examinee, assignedExamSet]);

  const handleStartExam = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/exam/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("examToken")}`,
        },
        body: JSON.stringify({ examSetId: assignedExamSet?.examSetId }),
      });

      if (res.status === 403) {
        // 시험이 이미 시작됨 → 진입 차단 화면으로 이동
        navigate("/exam-blocked");
        return;
      }

      const { sessionId } = await res.json();
      useExamStore.getState().setSession({ sessionId });
      navigate("/exam/section-waiting");
    } catch (err) {
      console.error("시험 시작 오류:", err);
    }
  };

  return (
    <div className="waiting-room">
      {/* 기존 대기실 UI */}
      <div className="waiting-content">
        <ExamineeCard examinee={examinee} />
        <ExamScheduleTable examSet={assignedExamSet} />
        <div className="clock-display">
          {/* 현재 시각 */}
        </div>
      </div>

      {/* 10초 카운트다운 오버레이 */}
      {countdownSeconds !== null && (
        <CountdownOverlay seconds={countdownSeconds} />
      )}
    </div>
  );
};

export default WaitingRoomScreen;
```

---

### 7.2 CountdownOverlay 컴포넌트 (SCR-W01)

```typescript
// client/src/components/common/CountdownOverlay.tsx
import React from "react";

interface Props {
  seconds: number; // 10 → 1 → 0 (0이면 "시작!" 표시)
}

const CountdownOverlay: React.FC<Props> = ({ seconds }) => {
  const progressPercent = seconds > 0 ? ((10 - seconds) / 10) * 100 : 100;

  return (
    <div
      className="countdown-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 48, 135, 0.92)", // TOPIK 딥블루
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        userSelect: "none",
        pointerEvents: "all", // 클릭 차단
      }}
    >
      <p style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "1rem" }}>
        잠시 후 시험이 시작됩니다
      </p>

      {/* 대형 카운트다운 숫자 */}
      <div
        style={{
          fontSize: seconds > 0 ? "8rem" : "4rem",
          fontWeight: 900,
          color: seconds > 3 ? "#ffffff" : "#FF4444", // 3초 이하: 빨간색
          letterSpacing: "-2px",
          lineHeight: 1,
          marginBottom: "2rem",
          transition: "font-size 0.1s, color 0.3s",
        }}
      >
        {seconds > 0 ? seconds : "시작!"}
      </div>

      {/* 진행 바 */}
      <div
        style={{
          width: "320px",
          height: "8px",
          backgroundColor: "rgba(255,255,255,0.3)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: seconds > 3 ? "#4CAF50" : "#FF4444",
            borderRadius: "4px",
            transition: "width 0.9s linear, background-color 0.3s",
          }}
        />
      </div>
    </div>
  );
};

export default CountdownOverlay;
```

---

### 7.3 ExamBlockedScreen 컴포넌트 (SCR-W02)

```typescript
// client/src/components/screens/ExamBlockedScreen.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * SCR-W02: 시험 시작 후 늦게 접속한 응시자에게 표시되는 화면.
 * POST /api/exam/sessions → HTTP 403 응답 시 navigate("/exam-blocked")
 */
const ExamBlockedScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("examToken");
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        fontFamily: "Noto Sans KR, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "48px 56px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          maxWidth: "480px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⛔</div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#C0392B",
            marginBottom: "1rem",
          }}
        >
          시험이 이미 시작되었습니다
        </h1>

        <p style={{ color: "#555", fontSize: "1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          정해진 시험 시작 시각 이후에는
          <br />
          시험 화면에 진입하실 수 없습니다.
          <br />
          <br />
          담당 감독관 또는 시험 관리자에게 문의하세요.
        </p>

        <button
          onClick={handleLogout}
          style={{
            padding: "12px 32px",
            backgroundColor: "#003087",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default ExamBlockedScreen;
```

---

### 7.4 examStore 업데이트 — 동시시작 상태 추가

```typescript
// examStore.ts 추가 항목
interface ExamState {
  // ... 기존 상태 ...

  // ✅ 동시시작 관련 상태 추가
  scheduledStartAt: string | null;         // ISO8601, 서버에서 조회
  countdownSeconds: number | null;         // null=카운트다운 미표시
  isExamBlocked: boolean;                  // 시험 시작 후 늦게 접속한 경우
  wsSocket: Socket | null;                 // WebSocket 인스턴스 참조

  setScheduledStartAt: (t: string | null) => void;
  setCountdownSeconds: (s: number | null) => void;
  setExamBlocked: (v: boolean) => void;
  setWsSocket: (s: Socket | null) => void;
}
```

---

### 7.5 라우터 추가 (App.tsx)

```typescript
// client/src/App.tsx — 라우터 추가
import ExamBlockedScreen from "./components/screens/ExamBlockedScreen";

// 기존 라우트에 추가
<Route path="/exam-blocked" element={<ExamBlockedScreen />} />
```

---

### 7.6 완료 조건 (동시시작)

- [x] WaitingRoomScreen: `/exam` WebSocket 네임스페이스 연결 및 `waiting:join` 이벤트 전송
- [x] `exam:countdown` 이벤트 수신 시 CountdownOverlay 표시 (seconds: 10~1)
- [x] `exam:start` 이벤트 수신 시 자동으로 시험 세션 생성 후 시험 화면으로 전환
- [x] POST /api/exam/sessions → 403 응답 시 `/exam-blocked` 화면으로 이동
- [x] CountdownOverlay: 10초 카운트다운, 3초 이하 빨간색, 0초 "시작!" 텍스트
- [x] ExamBlockedScreen: 진입 차단 안내 + 로그아웃 버튼
- [x] App.tsx: `/exam-blocked` 라우트 추가

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] ExamHeader 컴포넌트 — 타이머, 수험번호, 시험명 표시 — `client/src/shared/components/ExamHeader.tsx`
- [x] ExamNavigation 컴포넌트 — 이전/다음, 전체문제 버튼, nextLabel 지원 — `client/src/shared/components/ExamNavigation.tsx`
- [x] ExamineeCard 컴포넌트 — 수험자 정보 카드 — `client/src/shared/components/ExamineeCard.tsx`
- [x] CountdownOverlay 컴포넌트 — 10초 카운트다운, 3초 이하 빨간색 — `client/src/shared/components/CountdownOverlay.tsx`
- [x] NetworkStatusBanner 컴포넌트 — hasNetworkError 연동 주황 배너 — `client/src/shared/components/NetworkStatusBanner.tsx`
- [x] LoginScreen (SCR-01) — 9자리 수험번호, 비밀번호, 5회 잠금 — `client/src/exam/pages/LoginScreen.tsx`
- [x] ExamineeVerifyScreen (SCR-02) — 사진, 수험번호, 성명 확인 — `client/src/exam/pages/ExamineeVerifyScreen.tsx`
- [x] ExamSetSelectScreen — 배정 세트 조회, 영역/시간 테이블 — `client/src/exam/pages/ExamSetSelectScreen.tsx`
- [x] WaitingRoomScreen (SCR-04) — WebSocket /exam, countdown, session 생성 — `client/src/exam/pages/WaitingRoomScreen.tsx`
- [x] SectionWaitingScreen (SCR-05) — 5초 카운트다운, 자동 전환 — `client/src/exam/pages/SectionWaitingScreen.tsx`
- [x] ExamBlockedScreen (SCR-W02) — 진입 차단 안내, 로그아웃 — `client/src/exam/pages/ExamBlockedScreen.tsx`
- [x] Zustand examStore — 응시자 상태, 네트워크 에러, 동시시작 상태 관리 — `client/src/store/examStore.ts`
- [x] examApi — 인증/세션 API 호출 — `client/src/api/examApi.ts`
- [x] exam.types.ts — 공통 타입 정의 — `client/src/types/exam.types.ts`
- [x] App.tsx 라우트 — /exam-blocked 라우트 포함 — `client/src/App.tsx`

### 미완료 항목 (Phase 2)
- [ ] Timer.tsx 별도 컴포넌트 분리 (현재 ExamHeader 내부에 포함)
- [ ] authApi.ts 별도 파일 분리 (현재 examApi.ts에 통합)

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `src/components/common/ExamHeader.tsx` | `client/src/shared/components/ExamHeader.tsx` | ✅ |
| `src/components/common/ExamNavigation.tsx` | `client/src/shared/components/ExamNavigation.tsx` | ✅ |
| `src/components/common/ExamineeCard.tsx` | `client/src/shared/components/ExamineeCard.tsx` | ✅ |
| `src/components/common/Timer.tsx` | (ExamHeader 내부에 포함) | ⏳ |
| `src/components/common/CountdownOverlay.tsx` | `client/src/shared/components/CountdownOverlay.tsx` | ✅ |
| `src/components/screens/LoginScreen.tsx` | `client/src/exam/pages/LoginScreen.tsx` | ✅ |
| `src/components/screens/ExamineeVerifyScreen.tsx` | `client/src/exam/pages/ExamineeVerifyScreen.tsx` | ✅ |
| `src/components/screens/ExamTypeSelectScreen.tsx` | `client/src/exam/pages/ExamSetSelectScreen.tsx` | ✅ |
| `src/components/screens/WaitingRoomScreen.tsx` | `client/src/exam/pages/WaitingRoomScreen.tsx` | ✅ |
| `src/components/screens/SectionWaitingScreen.tsx` | `client/src/exam/pages/SectionWaitingScreen.tsx` | ✅ |
| `src/components/screens/ExamBlockedScreen.tsx` | `client/src/exam/pages/ExamBlockedScreen.tsx` | ✅ |
| `src/stores/examStore.ts` | `client/src/store/examStore.ts` | ✅ |
| `src/api/authApi.ts` | `client/src/api/examApi.ts` (통합) | ✅ |
| `src/types/exam.types.ts` | `client/src/types/exam.types.ts` | ✅ |
| `src/components/NetworkStatusBanner.tsx` | `client/src/shared/components/NetworkStatusBanner.tsx` | ✅ |

### 비고
- 문서에서 `src/components/common/`, `src/components/screens/` 구조를 사용하나, 실제 구현은 `client/src/shared/components/`와 `client/src/exam/pages/`로 재구성됨
- `ExamTypeSelectScreen`은 실제로 `ExamSetSelectScreen`으로 이름 변경하여 구현됨
- `Timer.tsx`는 독립 파일로 분리되지 않고 ExamHeader 내부에 타이머 로직이 포함됨
- `authApi.ts`는 별도 파일 없이 `examApi.ts`에 인증 관련 API가 통합됨
- `SubmitReviewScreen.tsx`, `ExamEndScreen.tsx`는 문서에 명시되지 않았으나 실제 구현에 존재함 (TASK-05 영역)
