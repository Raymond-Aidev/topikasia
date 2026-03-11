# TASK-04: 읽기 영역 구현

> 연관 PRD: READ-01~10
> 참고 화면: SCR-09~14 (읽기 문항 유형별), SCR-14 (전체문제 팝업)
> 연관 문서: [TASK-08 문제 출제 모듈](./TASK-08_문제출제모듈.md) — 읽기 문항 8개 유형 Import 연계 (READ_MCQ_SINGLE~READ_MATCH_INFO)
> 우선순위: Phase 1 (4지선다, 드롭다운) / Phase 2 (D&D, 삽입 위치)

---

## 목표

TOPIK I·II 읽기 영역 전 문항 유형을 구현한다.
읽기 영역은 가장 다양한 인터랙션 유형(5종)을 포함하며,
전체 문제 팝업과 문항 간 자유 이동 기능이 핵심이다.

---

## 1. 읽기 영역 문항 유형 정리

| 유형 코드 | 설명 | Phase |
|----------|------|-------|
| MCQ_SINGLE | 4지선다 단일 선택 (라디오 버튼) | P1 |
| MCQ_MULTI | 4지선다 복수 선택 (체크박스, N개 제한) | P1 |
| DROPDOWN | 지문 내 빈칸 드롭다운 선택 | P1 |
| ORDERING | 문장 카드 순서 배열 (Drag & Drop) | P2 |
| INSERT_POSITION | 지문 내 문장 삽입 위치 선택 | P2 |

---

## 2. 화면 구조

### 2-1. 기본 레이아웃 (MCQ_SINGLE / MCQ_MULTI)

```
┌──────────────────────────────────────────────────────────────────────┐
│  001007155 │ 한국어능력시험(TOPIK) IBT - TOPIK II │ ⏱ 남은 시험 시간 00:54:35 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [읽기]                                                   1 / 30    │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  6. 다음 글 또는 그래프의 내용과 같은 것을 **두 개** 고르십시오.      │
│                                                                      │
│  [지문 또는 이미지 (선택적)]                                          │
│                                                                      │
│  ① 선택지 A                                                          │
│  ② 선택지 B                                                          │
│  ③ 선택지 C                                                          │
│  ④ 선택지 D                                                          │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  [< 이전]            [⊞ 전체 문제]                      [다음 >]    │
└──────────────────────────────────────────────────────────────────────┘
```

### 2-2. 드롭다운 유형 (DROPDOWN)

```
  1. 빈칸에 들어갈 말로 가장 알맞은 것을 고르십시오.

  동생은 기타를 [▼ 드롭다운 ▼] 노래 부르는 것을 좋아한다.
                 ① 치려면
                 ② 치도록
                 ③ 치면서   ← 선택 시 하이라이트
                 ④ 치는지
```

### 2-3. 문장 배열 유형 (ORDERING)

```
  7. 다음 문장에 이어질 내용을 순서에 맞게 배열하십시오.

  ┌────────────────────────┐   ┌────────────────────────────────────┐
  │  출근 시간에 아파트     │   │  제시문                            │
  │  엘리베이터 안에...    │   │  ┌──────────────────────────────┐  │
  │                        │   │  │ 사람들은 말없이 각자           │  │
  │  [이곳에 문장을 끌어   │   │  │ 휴대폰만 쳐다보고 있었다.    │  │
  │   오세요.]             │   │  └──────────────────────────────┘  │
  │  [이곳에 문장을 끌어   │   │  ┌──────────────────────────────┐  │
  │   오세요.]             │   │  │ 그때 한 아이가 "저 어제..."   │  │
  │  [이곳에 문장을 끌어   │   │  └──────────────────────────────┘  │
  │   오세요.]             │   │  ┌──────────────────────────────┐  │
  └────────────────────────┘   │  │ 순간 조용하던 엘리베이터...   │  │
                               │  └──────────────────────────────┘  │
                               └────────────────────────────────────┘
```

### 2-4. 삽입 위치 유형 (INSERT_POSITION)

```
  25. <제시 문장>이 들어갈 가장 알맞은 곳을 고르십시오.

  ┌───────────────────────────────────┐  ┌────────────────────────────┐
  │ 허리, 어깨 등에서 느끼는... ①     │  │ 제시 문장                  │
  │ 근육통이 있으면 사람들은... ②     │  │ 근육통이 있을 때 내장 기관  │
  │ 그런데 외부 자극이 없는데도... ③  │  │ 의 건강을 확인해야 하는     │
  │ 통증의 원인은 내장에서... ④       │  │ 것은 이 때문이다.           │
  │ (선택 시 해당 위치 파란 강조)     │  └────────────────────────────┘
  └───────────────────────────────────┘
```

---

## 3. 컴포넌트 설계

### ReadingScreen (최상위)
```typescript
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answers, setAnswers] = useState<Record<string, ReadingAnswer>>({});
const [showAllQuestions, setShowAllQuestions] = useState(false);
```

### MCQQuestion 컴포넌트 (MCQ_SINGLE / MCQ_MULTI 공통)
```typescript
interface MCQQuestionProps {
  question: ReadingQuestion;
  selectedIds: number[];
  maxSelect: number;            // 1=단일, 2=복수
  onChange: (ids: number[]) => void;
}
```

**단일 선택 (maxSelect=1)**:
- 라디오 버튼 UX: 클릭 시 이전 선택 자동 해제
- 선택된 항목: 파란 배경 `#E3F2FD` + 파란 테두리

**복수 선택 (maxSelect=2)**:
- 체크박스 UX: 선택 개수 제한 (maxSelect 초과 클릭 무시)
- 이미 N개 선택 시 추가 클릭 → 토스트 메시지: "최대 N개까지 선택 가능합니다."
- 문제 지시문에서 **두 개** 등 강조 텍스트 파싱하여 maxSelect 결정

### DropdownQuestion 컴포넌트
```typescript
interface DropdownQuestionProps {
  question: ReadingQuestion;     // passageText에 [BLANK] 마커 포함
  selectedId: number | null;
  onChange: (optionId: number) => void;
}
```

**구현 방식**:
- passageText에 `[BLANK]` 마커를 드롭다운 컴포넌트로 대체 렌더링
- 드롭다운 열림/닫힘 상태 관리
- 선택지: ①②③④ 형식으로 드롭다운 목록 표시
- 선택 시 드롭다운 닫히고 선택값이 빈칸에 표시됨

```typescript
// passageText 파싱 예시
"동생은 기타를 [BLANK] 노래 부르는 것을 좋아한다."
→ "동생은 기타를 " + <DropdownSelect /> + " 노래 부르는 것을 좋아한다."
```

### OrderingQuestion 컴포넌트 (Phase 2)
```typescript
// dnd-kit 사용 권장
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";

interface OrderingQuestionProps {
  question: ReadingQuestion;
  orderedIds: string[];
  onChange: (orderedIds: string[]) => void;
}
```

**레이아웃**: 2열 (좌: 드롭 영역, 우: 문장 카드 풀)
**드래그**: 우측 카드 → 좌측 빈 슬롯에 드롭
**재배치**: 좌측 이미 배치된 카드끼리 순서 바꾸기 가능
**초기 상태**: 좌측 슬롯은 모두 비어있음 ("이 곳에 문장을 끌어 오세요.")

### InsertPositionQuestion 컴포넌트 (Phase 2)
```typescript
interface InsertPositionQuestionProps {
  question: ReadingQuestion;    // passageText에 [POS_1], [POS_2] 마커
  selectedPosition: number | null;
  sentenceToInsert: string;
  onChange: (position: number) => void;
}
```

**구현 방식**:
- passageText에 `[POS_1]`, `[POS_2]`, `[POS_3]`, `[POS_4]` 마커를 클릭 가능한 ① ② ③ ④ 원형 배지로 대체
- 클릭 시 해당 위치 직후에 삽입 문장 파란색으로 미리보기 표시
- 2열 레이아웃: 좌=지문, 우=제시문장 박스

---

## 4. 전체 문제 팝업 (SCR-14)

```
┌──────────────────────────────────────────────────────────────────┐
│  전체문제                                              [×]       │
│  ────────────────────────────────────────────────────────        │
│  [전체문제: 30개]    [안 푼 문제: 26개]                           │
│  ────────────────────────────────────────────────────────        │
│  01  02  03  04  05  06  07  08  09  10                         │
│   ③  (분)(분)(분)(분)(분)(분)(분)(분)(분)                         │
│  11  12  13  14  15  16  17  18  19  20                         │
│  (분)(분)(분)(분)(분)(분)(분)(분)(분)(분)                         │
│  21  22  23  24  25  26  27  28  29  30                         │
│  (분)(분)(분)(분)(분)(분)(분)(분)(분)(분)                         │
│                                                                  │
│  22초 후 팝업이 자동으로 닫힙니다.           [답안 제출 →]       │
└──────────────────────────────────────────────────────────────────┘
```

**컴포넌트**: `AllQuestionsPopup`
```typescript
interface AllQuestionsPopupProps {
  questions: ReadingQuestion[];
  answers: Record<string, ReadingAnswer>;
  currentQuestionIndex: number;
  onNavigate: (index: number) => void;  // 문항으로 이동
  onSubmit: () => void;                 // 답안 제출
  onClose: () => void;
  autoCloseSeconds?: number;           // 기본 30초
}
```

**셀 상태별 스타일**:
- 미응답: 분홍 배경 `#FFCDD2`
- 응답 완료: 흰색 배경 + 선택 답안 번호 표시
- 현재 문항: 파란 테두리 강조
- 탭: "전체문제" / "안 푼 문제" (탭 전환으로 필터링)

**자동 닫힘**:
```typescript
useEffect(() => {
  if (!autoCloseSeconds) return;
  const timer = setTimeout(onClose, autoCloseSeconds * 1000);
  const countdown = setInterval(() => setSecondsLeft(s => s - 1), 1000);
  return () => { clearTimeout(timer); clearInterval(countdown); };
}, []);
```

---

## 5. 데이터 타입

```typescript
type ReadingQuestionType = "MCQ_SINGLE" | "MCQ_MULTI" | "DROPDOWN" | "ORDERING" | "INSERT_POSITION";

interface ReadingQuestion {
  questionId: string;
  questionNumber: number;
  section: "READING";
  questionType: ReadingQuestionType;
  instruction: string;
  passageText?: string;         // 지문 텍스트 ([BLANK], [POS_N] 마커 포함)
  imageUrl?: string;            // 그래프, 도표 이미지
  
  options?: { id: number; text: string }[];  // MCQ/DROPDOWN 선택지
  maxSelect?: number;           // MCQ_MULTI: 최대 선택 수
  
  // ORDERING
  sentenceCards?: { id: string; text: string }[];
  
  // INSERT_POSITION
  sentenceToInsert?: string;
}

interface ReadingAnswer {
  questionId: string;
  questionType: ReadingQuestionType;
  selectedOptions?: number[];       // MCQ
  selectedDropdown?: number;        // DROPDOWN
  orderedCardIds?: string[];        // ORDERING
  insertPosition?: number;          // INSERT_POSITION
  savedAt: string;
}
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

## 6. 완료 조건 (Acceptance Criteria)

**Phase 1**:
- [x] MCQ_SINGLE: 4지선다 단일 선택 및 선택 상태 표시
- [x] MCQ_MULTI: 복수 선택, 선택 개수 제한 적용
- [x] DROPDOWN: 지문 내 드롭다운 렌더링 및 선택
- [x] 이미지/그래프 포함 문항 렌더링
- [x] 이전/다음 버튼 내비게이션
- [x] 전체 문제 팝업 (열기/닫기/자동 닫힘)
- [x] 전체 문제 팝업에서 문항 번호 클릭 시 이동
- [x] 안 푼 문제 분홍 강조 표시
- [x] 답안 자동 저장 (로컬 + 서버)

**Phase 2**:
- [ ] ORDERING: 문장 카드 Drag & Drop 배열
- [ ] INSERT_POSITION: 지문 내 위치 클릭 선택 + 삽입 문장 미리보기

---

## 7. 파일 구조

```
src/
├── components/screens/
│   └── ReadingScreen.tsx
├── components/reading/
│   ├── MCQQuestion.tsx
│   ├── DropdownQuestion.tsx
│   ├── OrderingQuestion.tsx      (Phase 2)
│   ├── InsertPositionQuestion.tsx (Phase 2)
│   └── AllQuestionsPopup.tsx
└── api/
    └── readingApi.ts
```

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] ReadingScreen 최상위 화면 — 문항 전환, 전체문제 팝업 연동 — `client/src/exam/pages/ReadingScreen.tsx`
- [x] MCQQuestion 컴포넌트 — 4지선다 단일/복수 선택, maxSelect 제한 — `client/src/exam/components/MCQQuestion.tsx`
- [x] DropdownQuestion 컴포넌트 — 지문 내 [BLANK] 파싱, 인라인 드롭다운 — `client/src/exam/components/DropdownQuestion.tsx`
- [x] AllQuestionsPopup 컴포넌트 — 10열 그리드, 전체/안 푼 문제 탭, 30초 자동 닫힘 — `client/src/exam/components/AllQuestionsPopup.tsx`
- [x] useAutoSave 커스텀 훅 — IndexedDB + 서버 동기화, 지수 백오프 — `client/src/exam/hooks/useAutoSave.ts`
- [x] 이미지/그래프 포함 문항 렌더링
- [x] 이전/다음 내비게이션 + 전체 문제 버튼
- [x] 안 푼 문제 분홍 강조 (#FFCDD2)
- [x] 팝업에서 문항 번호 클릭 시 해당 문항으로 이동
- [x] T2-01 ACID: 지수 백오프 재시도 (5회, 최대 30초)
- [x] T3-03 ACID: NetworkStatusBanner 연동

### 미완료 항목 (Phase 2)
- [ ] OrderingQuestion 컴포넌트 — 문장 카드 Drag & Drop 배열 (dnd-kit)
- [ ] InsertPositionQuestion 컴포넌트 — 지문 내 위치 클릭 + 삽입 문장 미리보기
- [ ] readingApi.ts 별도 파일 분리 (현재 examApi.ts에 통합)

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `src/components/screens/ReadingScreen.tsx` | `client/src/exam/pages/ReadingScreen.tsx` | ✅ |
| `src/components/reading/MCQQuestion.tsx` | `client/src/exam/components/MCQQuestion.tsx` | ✅ |
| `src/components/reading/DropdownQuestion.tsx` | `client/src/exam/components/DropdownQuestion.tsx` | ✅ |
| `src/components/reading/AllQuestionsPopup.tsx` | `client/src/exam/components/AllQuestionsPopup.tsx` | ✅ |
| `src/components/reading/OrderingQuestion.tsx` | (미구현) | ⏳ |
| `src/components/reading/InsertPositionQuestion.tsx` | (미구현) | ⏳ |
| `src/hooks/useAutoSave.ts` | `client/src/exam/hooks/useAutoSave.ts` | ✅ |
| `src/api/readingApi.ts` | `client/src/api/examApi.ts` (통합) | ✅ |

### 비고
- 문서에서 `src/components/screens/`, `src/components/reading/` 구조를 사용하나, 실제 구현은 `client/src/exam/pages/`와 `client/src/exam/components/`로 재구성됨
- `MCQQuestion.tsx`는 듣기/읽기 영역에서 공유 사용됨 (MCQ_SINGLE/MCQ_MULTI 모두 지원)
- `OrderingQuestion.tsx`와 `InsertPositionQuestion.tsx`는 Phase 2 항목으로 아직 미구현 (코드에 TODO 주석만 존재)
- `readingApi.ts`는 별도 파일 없이 `examApi.ts`에 통합됨
- 읽기 영역만 전체 문제 팝업(AllQuestionsPopup)과 하단 네비게이션의 "전체 문제" 버튼을 제공
