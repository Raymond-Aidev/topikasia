# TASK-05: 답안 제출 및 시험 종료 구현

> 연관 PRD: SUBMIT-01~07
> 참고 화면: SCR-15(답안 제출), SCR-16(확인 모달), SCR-17(시험 종료)
> 연관 문서: [TASK-06 어드민 회원관리·시험세트배정](./TASK-06_어드민_회원관리_시험세트배정.md) · [TASK-07 운영모니터링](./TASK-07_어드민_운영모니터링.md)
> 우선순위: Phase 1 (MVP 필수)
> 적용 대상: 모든 영역 (듣기/쓰기/읽기 공통 흐름)

---

## 목표

각 영역의 답안 제출 화면, 최종 제출 확인 모달, 시험 종료 안내 화면을 구현한다.
영역별 시험이 종료된 후 다음 영역으로 자동 전환하는 흐름도 포함한다.

---

## 1. 전체 제출 흐름

```
[마지막 문항에서 "다음" 클릭]
         ↓
[답안 제출 화면 (SCR-15)]
  - 수험자 정보 카드
  - 답안 현황 (전체/푼/안 푼)
  - 문항별 답안 목록
  - [< 이전] [답안 제출 >]
         ↓ (답안 제출 클릭)
[제출 확인 모달 (SCR-16)]
  - "제출 후 수정 불가" 경고
  - [취소] [제출]
         ↓ (제출 클릭)
[서버에 최종 제출 전송]
         ↓
[시험 종료 안내 (SCR-17)] ← 마지막 영역인 경우
         또는
[다음 영역 대기 화면] ← 중간 영역인 경우 (쓰기 → 읽기 전환)
```

---

## 2. 답안 제출 화면 (SCR-15)

### UI 명세

```
┌──────────────────────────────────────────────────────────────────────┐
│  001007155 │ 한국어능력시험(TOPIK) IBT - TOPIK II │ ⏱ 현재시간 15:57:36 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────── 수험자 정보 ────────────────────────────────────────────┐  │
│  │  ◎ 좌석 1  │ [사진] │ 수험번호: 001007155  │ 성명: TOPIK KIM  │  │
│  │            │        │ 기관: 국립국제교육원 제1시험실            │  │
│  │            │        │                      서명: ___________   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  전체 문제 수: 3  |  푼 문제 수: 1  |  안 푼 문제 수: 2             │
│  답안 제출 일시: 실제 응시자가 답변을 제출한 일시로 표기됩니다.        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  01  ㄱ: 가입하게 되었습니다                                 │    │
│  │      ㄴ: (미입력) ← 분홍 배경                                │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  02  ← 분홍 배경 (미입력)                                   │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  03  ← 분홍 배경 (미입력)                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  [< 이전]                                      [답안 제출 →]        │
└──────────────────────────────────────────────────────────────────────┘

※ 툴팁: "쓰기 영역 답안 제출 화면입니다. 답안 확인 후 [답안 제출] 버튼을 클릭하세요."
```

### 컴포넌트: SubmitReviewScreen

```typescript
interface SubmitReviewScreenProps {
  section: "LISTENING" | "WRITING" | "READING";
  questions: Question[];
  answers: Record<string, Answer>;
  examineeInfo: ExamineeInfo;
  onBack: () => void;
  onSubmit: () => void;
}
```

### 답안 현황 표시 로직

```typescript
const totalCount = questions.length;
const answeredCount = questions.filter(q => isAnswered(answers[q.questionId])).length;
const unansweredCount = totalCount - answeredCount;

function isAnswered(answer: Answer): boolean {
  if (!answer) return false;
  switch (answer.questionType) {
    case "MCQ_SINGLE": return (answer.selectedOptions?.length ?? 0) > 0;
    case "MCQ_MULTI":  return (answer.selectedOptions?.length ?? 0) > 0;
    case "DROPDOWN":   return answer.selectedDropdown != null;
    case "SHORT_ANSWER": return (answer.gapAnswers?.["ㄱ"] || "").trim().length > 0
                          || (answer.gapAnswers?.["ㄴ"] || "").trim().length > 0;
    case "ESSAY":      return (answer.essayText || "").trim().length > 0;
    case "ORDERING":   return (answer.orderedCardIds?.length ?? 0) > 0;
    case "INSERT_POSITION": return answer.insertPosition != null;
    default: return false;
  }
}
```

### 영역별 답안 목록 표시

**듣기/읽기 (MCQ)**:
```
01  ③
02  (미입력)   ← 분홍 배경
03  ①②       ← 복수 선택
```

**쓰기 (단답)**:
```
01  ㄱ: 가입하게 되었습니다
    ㄴ: (미입력)   ← 분홍 배경
02  ㄱ: ...
    ㄴ: ...
```

**쓰기 (서술)**:
```
03  자율 주행 택시의 자용화에 대해...  (앞부분 50자 미리보기)
    글자 수: 247자
```

---

## 3. 제출 확인 모달 (SCR-16)

```
┌─────────────────────────────────────────────┐
│  답안 제출                              [×]  │
│  ─────────────────────────────────────────  │
│                                             │
│  답안을 제출하면 답안 수정 및 이의 제기가    │
│  불가능합니다.                              │
│  해당 내용을 인지했다면 '제출' 버튼을        │
│  클릭해주세요.                              │
│                                             │
│        [     취소     ]  [    제출    ]     │
│                                             │
└─────────────────────────────────────────────┘

※ 배경 오버레이: rgba(0,0,0,0.4)
※ 툴팁 (모달 외부): "[제출] 버튼을 클릭한 이후에는 문제 화면으로 돌아갈 수 없습니다."
```

### 컴포넌트: SubmitConfirmModal

```typescript
interface SubmitConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;  // 제출 중 로딩 상태
}
```

**구현 세부사항**:
- 모달 외부 클릭: 닫히지 않음 (실수 제출 방지)
- [×] 버튼 = [취소] 동일 동작
- [제출] 클릭 후: 버튼 비활성화 + 로딩 스피너 표시 (중복 제출 방지)

---

## 4. 최종 제출 API 호출

```typescript
async function submitSection(section: string, answers: Record<string, Answer>) {
  setIsSubmitting(true);
  
  try {
    const response = await fetch(`/api/exam/sessions/${sessionId}/submit-section`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        sectionName: section,
        submittedAt: new Date().toISOString()
      })
    });
    
    if (!response.ok) throw new Error("제출 실패");
    
    // 성공 → 다음 화면 전환
    const nextScreen = getNextScreen(section, examType);
    navigate(nextScreen);
    
  } catch (error) {
    // 실패 → 재시도 안내
    showErrorToast("제출에 실패했습니다. 다시 시도해주세요.");
  } finally {
    setIsSubmitting(false);
  }
}

// API Endpoint
POST /api/exam/sessions/:sessionId/submit-section
Body: {
  sectionName: "LISTENING" | "WRITING" | "READING"
}
Response: { section: string, submittedAt: string, isAutoSubmitted: boolean }
```

---

## 5. 시험 종료 안내 화면 (SCR-17)

```
┌──────────────────────────────────────────────────────────────────────┐
│  001007155 │ 한국어능력시험(TOPIK) IBT - TOPIK II │ 현재시간 15:58:43 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────── 시험 종료 안내 ──────────────────────┐       │
│  │                                                TOPIK 로고 │       │
│  │  국립국제교육원  |  제1시험실                             │       │
│  │                                                           │       │
│  │   ◎ 좌석 1  │ [사진] │ 수험번호: 001007155              │       │
│  │                        성명: TOPIK KIM                    │       │
│  │                                                           │       │
│  │  ┌──────────────────────────────────────────────────┐   │       │
│  │  │  모든 시험이 종료되었습니다.                       │   │       │
│  │  │  감독관의 안내가 있을 때까지 대기해 주시기 바랍니다. │   │       │
│  │  └──────────────────────────────────────────────────┘   │       │
│  │                                                           │       │
│  │              [  시험 종료  ] ← 비활성화 (회색)            │       │
│  └───────────────────────────────────────────────────────────┘       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
※ 툴팁: "시험 종료 안내 화면입니다. [종료] 버튼을 클릭해 체험하기를 종료하세요."
```

### 컴포넌트: ExamEndScreen

```typescript
interface ExamEndScreenProps {
  examineeInfo: ExamineeInfo;
  onExamEnd: () => void;  // 감독관이 활성화하면 호출
}
```

**[시험 종료] 버튼 활성화 로직**:
```typescript
// WebSocket으로 감독관 "시험 종료 허가" 이벤트 수신
useEffect(() => {
  ws.on("exam:end_allowed", () => {
    setEndButtonEnabled(true);
  });
}, []);

// 또는: 일정 시간 후 자동 활성화 (폴백)
useEffect(() => {
  const timer = setTimeout(() => setEndButtonEnabled(true), 60_000);
  return () => clearTimeout(timer);
}, []);
```

---

## 6. 영역 전환 흐름

```typescript
function getNextScreen(section: string, examType: string): string {
  if (examType === "TOPIK_I") {
    if (section === "LISTENING") return "/exam/waiting/reading";
    if (section === "READING")   return "/exam/end";
  }
  if (examType === "TOPIK_II") {
    if (section === "LISTENING") return "/exam/waiting/writing";
    if (section === "WRITING")   return "/exam/waiting/reading";
    if (section === "READING")   return "/exam/end";
  }
  return "/exam/end";
}
```

---

## 7. 자동 제출 (시간 만료)

```typescript
// 각 영역 타이머 만료 시 자동 제출
useEffect(() => {
  if (remainingSeconds <= 0) {
    // 현재까지 저장된 답안으로 자동 제출
    submitSection(currentSection, answers);
  }
}, [remainingSeconds]);
```

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 모든 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T2-01 | IndexedDB ↔ 서버 동기화 재시도 — 지수 백오프 (D-02)

**대상**: `client/src/hooks/useAutoSave.ts`

```typescript
// ❌ 기존: 단순 API 호출 → 실패 시 재시도 없음
await api.saveAnswers(answers);

// ✅ 수정: 지수 백오프 재시도 (최대 5회, 최대 30초 간격)
const MAX_RETRY = 5;

async function syncWithRetry(answers: Answer[]): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    try {
      await api.saveAnswers(answers);
      useExamStore.getState().setNetworkError(false);
      return; // 성공
    } catch {
      if (attempt < MAX_RETRY - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  // 최종 실패 → 사용자 경고 배너 표시
  useExamStore.getState().setNetworkError(true);
  // IndexedDB에는 이미 저장됨 → 답안 유실 없음
}

// useAutoSave 훅에서 직접 api.saveAnswers 대신 syncWithRetry 사용
useEffect(() => {
  const timer = setInterval(() => {
    const answers = getAllAnswersFromIndexedDB();
    syncWithRetry(answers);
  }, AUTO_SAVE_INTERVAL_MS);
  return () => clearInterval(timer);
}, []);
```

---

### T3-03 | 동기화 실패 사용자 알림 배너 (D-02 UX)

**대상**: `client/src/components/NetworkStatusBanner.tsx` (신규 파일)
`client/src/store/examStore.ts` — `hasNetworkError` 상태 추가

```typescript
// client/src/store/examStore.ts에 추가
interface ExamState {
  // 기존 상태...
  hasNetworkError: boolean;
  setNetworkError: (v: boolean) => void;
}

// examStore 구현에 추가
hasNetworkError: false,
setNetworkError: (v) => set({ hasNetworkError: v }),
```

```tsx
// client/src/components/NetworkStatusBanner.tsx (신규)
import { useExamStore } from "../store/examStore";

export function NetworkStatusBanner() {
  const hasNetworkError = useExamStore(s => s.hasNetworkError);
  if (!hasNetworkError) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFA500",
        color: "#000",
        padding: "8px 16px",
        textAlign: "center",
        fontWeight: "bold",
        zIndex: 9999
      }}
      role="alert"
    >
      ⚠️ 답안 저장 중 오류가 발생했습니다.
      인터넷 연결을 확인하고 감독관에게 알려주세요.
      답안은 기기에 임시 저장되어 있습니다.
    </div>
  );
}

// 사용: 시험 영역 최상위 레이아웃 컴포넌트에서 렌더링
// <NetworkStatusBanner />
// <ExamLayout>...</ExamLayout>
```

## 8. 완료 조건 (Acceptance Criteria)

- [ ] 답안 제출 화면: 수험자 정보 카드 표시
- [ ] 답안 제출 화면: 전체/푼/안 푼 문제 수 표시
- [ ] 답안 제출 화면: 문항별 입력 답안 목록 표시
- [ ] 안 푼 문항: 분홍 배경으로 강조
- [ ] [이전] 버튼: 마지막 문제 화면으로 돌아가기
- [ ] [답안 제출] 버튼: 제출 확인 모달 표시
- [ ] 제출 확인 모달: 경고 문구 표시
- [ ] [제출]: 서버 최종 제출 API 호출
- [ ] 제출 중: 버튼 비활성화 + 로딩 표시 (중복 제출 방지)
- [ ] 제출 성공: 다음 화면(영역 대기 또는 종료 안내)으로 전환
- [ ] 제출 실패: 오류 토스트 표시 후 재시도 가능
- [ ] 시험 종료 안내: [시험 종료] 버튼 비활성 상태로 표시
- [ ] 감독관 이벤트 수신 시 [시험 종료] 버튼 활성화
- [ ] 시간 만료 시 자동 제출 처리

---

## 9. 파일 구조

```
src/
├── components/screens/
│   ├── SubmitReviewScreen.tsx
│   └── ExamEndScreen.tsx
├── components/submit/
│   ├── SubmitConfirmModal.tsx
│   ├── AnswerSummaryList.tsx
│   └── ExamineeCard.tsx        (공통 컴포넌트 재사용)
└── api/
    └── submitApi.ts
```

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] 답안 제출 화면 (SubmitReviewScreen) — 답안 요약, 전체/푼/안푼 카운트, 문항 그리드, 분홍 배경 미응답 강조 — `exam/pages/SubmitReviewScreen.tsx`
- [x] 제출 확인 모달 — 인라인 구현 (별도 SubmitConfirmModal 파일 없음), 취소/제출 버튼, 제출 중 비활성화 — `exam/pages/SubmitReviewScreen.tsx` 내부
- [x] 최종 제출 API 호출 — POST /api/exam/sessions/:id/submit-section — `exam/pages/SubmitReviewScreen.tsx`
- [x] 시험 종료 안내 화면 (ExamEndScreen) — exam:allow-exit WebSocket 또는 60초 후 활성화 — `exam/pages/ExamEndScreen.tsx`
- [x] 영역 전환 흐름 — 중간 영역 → /exam/section-waiting, 마지막 영역 → /exam/end — `exam/pages/SectionWaitingScreen.tsx`
- [x] T2-01: IndexedDB ↔ 서버 동기화 재시도 (지수 백오프) — `exam/hooks/useAutoSave.ts`
- [x] T3-03: 동기화 실패 사용자 알림 배너 — `shared/components/NetworkStatusBanner.tsx`
- [x] 수험자 정보 카드 (공통 컴포넌트) — `shared/components/ExamineeCard.tsx`

### 미완료 항목 (Phase 2)
- [ ] SubmitConfirmModal 별도 컴포넌트 분리 (현재 SubmitReviewScreen 내부 인라인 구현)
- [ ] AnswerSummaryList 별도 컴포넌트 분리 (문서 명세 구조)
- [ ] submitApi.ts 별도 API 모듈 분리

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `components/screens/SubmitReviewScreen.tsx` | `exam/pages/SubmitReviewScreen.tsx` | ✅ |
| `components/screens/ExamEndScreen.tsx` | `exam/pages/ExamEndScreen.tsx` | ✅ |
| `components/submit/SubmitConfirmModal.tsx` | `exam/pages/SubmitReviewScreen.tsx` (인라인) | ✅ |
| `components/submit/AnswerSummaryList.tsx` | `exam/pages/SubmitReviewScreen.tsx` (인라인) | ✅ |
| `components/submit/ExamineeCard.tsx` | `shared/components/ExamineeCard.tsx` | ✅ |
| `api/submitApi.ts` | (SubmitReviewScreen 내부 직접 호출) | ✅ |
| `hooks/useAutoSave.ts` | `exam/hooks/useAutoSave.ts` | ✅ |
| `components/NetworkStatusBanner.tsx` | `shared/components/NetworkStatusBanner.tsx` | ✅ |

### 비고
- 문서의 `src/components/screens/`, `src/components/submit/` 디렉토리 구조 대신 `src/exam/pages/` 경로로 구현됨
- SubmitConfirmModal, AnswerSummaryList는 별도 파일로 분리되지 않고 SubmitReviewScreen 내부에 인라인 구현
- SectionWaitingScreen.tsx가 영역 전환 대기 화면으로 추가 구현됨 (문서에는 별도 파일로 명시되지 않았으나 흐름상 필요)
