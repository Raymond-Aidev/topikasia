# TASK-03: 쓰기 영역 구현

> 연관 PRD: WRITE-01~07
> 참고 화면: SCR-05(쓰기 대기), SCR-07(단답), SCR-08(서술)
> 연관 문서: [TASK-08 문제 출제 모듈](./TASK-08_문제출제모듈.md) — 쓰기 문항(단답·서술) Import 연계
> 우선순위: Phase 1 (MVP 필수)
> 적용 대상: TOPIK II 전용

---

## 목표

TOPIK II 쓰기 영역을 구현한다. 문항 유형은 **빈칸 단답형 (1~2번)**과
**장문 서술형 (3번)**으로 구성된다. 실시간 자동 저장과 글자 수 카운터가 핵심이다.

---

## 1. 쓰기 영역 구성 (TOPIK II 기준)

| 문항 번호 | 유형 | 설명 |
|----------|------|------|
| 51번 | 빈칸 단답 (ㄱ/ㄴ) | 지문 읽고 ㄱ, ㄴ에 알맞은 말 각각 입력 |
| 52번 | 빈칸 단답 (ㄱ/ㄴ) | 동일 유형, 다른 지문 |
| 53번 | 장문 서술 (200~300자) | 주어진 조건에 맞게 글 작성 |
| 54번 | 장문 서술 (400~500자) | 논제에 대한 의견 서술 (논술형) |

> 체험 화면 기준: 문항 1~3번 (실제 시험은 51~54번)

---

## 2. 화면 구조

### 2-1. 단답형 문항 (SCR-07)

```
┌──────────────────────────────────────────────────────────────────────┐
│  001007155 │ 한국어능력시험(TOPIK) IBT - TOPIK II │ ⏱ 남은 시험 시간 00:48:45 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [쓰기]                                                   0 / 3     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  1. 다음 글의 ㄱ과 ㄴ에 알맞은 말을 각각 쓰시오.                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────┐               │
│  │  [지문 박스 — 게시판 글, 편지, 설명문 등]          │               │
│  │  ㄱ ( ______ ) 라는 내용이 포함된 지문 텍스트      │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                      │
│  ㄱ  [_______________________________________________]               │
│  ㄴ  [_______________________________________________]               │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  [< 이전]                                               [다음 >]    │
└──────────────────────────────────────────────────────────────────────┘
```

### 2-2. 장문 서술형 문항 (SCR-08)

```
┌──────────────────────────────────────────────────────────────────────┐
│  001007155 │ 한국어능력시험(TOPIK) IBT - TOPIK II │ ⏱ 남은 시험 시간 00:48:07 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [쓰기]                                                   0 / 3     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  3. 다음을 참고하여 400~500자로 글을 쓰시오.                           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐           │
│  │  자율 주행 택시의 상용화에 대한 본인의 의견을 쓰고,   │           │
│  │  두 가지 근거를 포함하여 주장하는 글을 쓰시오.        │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐           │
│  │                                                      │           │
│  │  내용을 입력하세요.                                   │           │
│  │                                                      │           │
│  │                                                      │           │
│  │                                                  0 / 500  │      │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  [< 이전]                                               [다음 >]    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. 컴포넌트 설계

### WritingScreen (최상위)
```typescript
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answers, setAnswers] = useState<Record<string, WritingAnswer>>({});
```

### ShortAnswerQuestion 컴포넌트
```typescript
interface ShortAnswerQuestionProps {
  question: WritingQuestion;
  answer: { gapA: string; gapB: string };
  onChange: (gapA: string, gapB: string) => void;
}
```

**구현 세부사항**:
- ㄱ 레이블 + 텍스트 입력 박스
- ㄴ 레이블 + 텍스트 입력 박스
- 각 입력 박스: `border-radius: 4px`, 파란 포커스 테두리
- placeholder: "내용을 입력하세요."
- 입력 시 실시간 자동 저장 (debounce 1000ms)

### EssayQuestion 컴포넌트
```typescript
interface EssayQuestionProps {
  question: WritingQuestion;
  answer: string;
  minChars: number;             // 예: 400
  maxChars: number;             // 예: 500
  onChange: (text: string) => void;
}
```

**구현 세부사항**:
- `<textarea>` 기반 대형 에디터
- 최소 높이 300px, 자동 높이 확장
- 글자 수 카운터: 우측 하단 "N / 500"
- 글자 수 색상 규칙:
  - 0 ~ minChars-1: 빨간색 (미달)
  - minChars ~ maxChars: 녹색 (정상 범위)
  - maxChars 초과: 빨간색 (초과)
- maxChars 초과 시 입력 차단 또는 경고 표시 (정책 확인 필요)
- 한국어 조합 입력(IME) 처리: `onCompositionEnd` 이벤트 활용

### PassageBox 컴포넌트
```typescript
// 지문/제시문 표시 박스 (단답형 + 서술형 공통)
interface PassageBoxProps {
  text: string;
  imageUrl?: string;
}
```

**스타일**:
- 배경: `#F5F5F5`
- 테두리: `1px solid #E0E0E0`, `border-radius: 4px`
- 패딩: 16px
- 폰트: 14px, 줄간격 1.6

---

## 4. 데이터 타입

```typescript
type WritingQuestionType = "SHORT_ANSWER" | "ESSAY";

interface WritingQuestion {
  questionId: string;
  questionNumber: number;       // 1~4 (실제: 51~54)
  section: "WRITING";
  questionType: WritingQuestionType;
  instruction: string;          // "다음 글의 ㄱ과 ㄴ에 알맞은 말을 각각 쓰시오."
  passageText: string;          // 지문 내용
  passageImageUrl?: string;     // 지문 이미지 (선택)
  
  // SHORT_ANSWER 전용
  gapLabels?: string[];         // ["ㄱ", "ㄴ"]
  
  // ESSAY 전용
  minChars?: number;            // 200
  maxChars?: number;            // 500
}

interface WritingAnswer {
  questionId: string;
  questionType: WritingQuestionType;
  
  // SHORT_ANSWER
  gapAnswers?: Record<string, string>; // { "ㄱ": "가입하게 되었습니다", "ㄴ": "" }
  
  // ESSAY
  essayText?: string;
  
  charCount?: number;
  savedAt: string;
}
```

---

## 5. 자동 저장 로직

```typescript
// useAutoSave.ts
function useAutoSave(questionId: string, answer: WritingAnswer, delay = 1000) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      // 1. IndexedDB 로컬 저장
      await saveAnswerLocal(questionId, answer);
      
      // 2. 서버 저장 (비동기, 실패 무시)
      saveAnswerRemote(questionId, answer).catch(console.error);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [answer]); // answer 변경마다 debounce 재시작
}

// API
PATCH /api/exam/answers
Body: {
  questionId: string,
  section: "WRITING",
  questionType: "SHORT_ANSWER" | "ESSAY",
  gapAnswers?: Record<string, string>,
  essayText?: string
}
```

---

## 6. 글자 수 카운터 구현

```typescript
// 한글 조합 중 글자 수가 부정확한 문제 방지
function useKoreanCharCount(text: string) {
  const [isComposing, setIsComposing] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    if (!isComposing) {
      // 공백 포함 전체 글자 수 (TOPIK 기준)
      setDisplayCount([...text].length);
    }
  }, [text, isComposing]);

  return {
    displayCount,
    onCompositionStart: () => setIsComposing(true),
    onCompositionEnd: (e: CompositionEvent) => {
      setIsComposing(false);
      setDisplayCount([...(e.data || "")].length + [...text].length);
    }
  };
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

## 7. 완료 조건 (Acceptance Criteria)

- [x] 쓰기 시작 대기 화면 → 시간 되면 자동 전환
- [x] 단답형: ㄱ/ㄴ 입력 박스 렌더링 및 입력 가능
- [x] 단답형: 지문 박스 표시
- [x] 서술형: 대형 텍스트 에디터 렌더링
- [x] 서술형: 실시간 글자 수 카운터 표시 (한글 조합 포함)
- [x] 글자 수 범위별 색상 피드백 (미달/정상/초과)
- [x] 입력 내용 debounce 자동 저장 (로컬 + 서버)
- [x] 이전/다음 버튼 내비게이션
- [x] 마지막 문항 → 쓰기 답안 제출 화면으로 이동

---

## 8. 파일 구조

```
src/
├── components/screens/
│   └── WritingScreen.tsx
├── components/writing/
│   ├── ShortAnswerQuestion.tsx
│   ├── EssayQuestion.tsx
│   └── PassageBox.tsx
├── hooks/
│   ├── useAutoSave.ts
│   └── useKoreanCharCount.ts
└── api/
    └── writingApi.ts
```

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] WritingScreen 최상위 화면 — 문항 전환, 내비게이션 — `client/src/exam/pages/WritingScreen.tsx`
- [x] ShortAnswerQuestion 컴포넌트 — ㄱ/ㄴ 입력 박스, 1000ms debounce — `client/src/exam/components/ShortAnswerQuestion.tsx`
- [x] EssayQuestion 컴포넌트 — 대형 텍스트 에디터, 글자 수 카운터, 색상 피드백 — `client/src/exam/components/EssayQuestion.tsx`
- [x] useKoreanCharCount 커스텀 훅 — 한글 IME 조합 처리, 글자 수 계산 — `client/src/exam/hooks/useKoreanCharCount.ts`
- [x] useAutoSave 커스텀 훅 — debounce 자동 저장, 지수 백오프 재시도 — `client/src/exam/hooks/useAutoSave.ts`
- [x] 단답형: 지문 박스 표시 (#F5F5F5 배경)
- [x] 서술형: min-height 300px, 자동 높이 확장
- [x] 글자 수 범위별 색상 피드백 (미달: 빨간, 정상: 초록, 초과: 빨간)
- [x] 이전/다음 내비게이션
- [x] 마지막 문항에서 /exam/submit/writing 이동
- [x] T2-01 ACID: 지수 백오프 재시도 (5회, 최대 30초)
- [x] T3-03 ACID: NetworkStatusBanner 연동

### 미완료 항목 (Phase 2)
- [ ] PassageBox 별도 컴포넌트 분리 (현재 ShortAnswerQuestion/EssayQuestion 내부에 인라인 구현)
- [ ] writingApi.ts 별도 파일 분리 (현재 examApi.ts에 통합)
- [ ] maxChars 초과 시 입력 차단 vs 경고 정책 확정 및 적용

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `src/components/screens/WritingScreen.tsx` | `client/src/exam/pages/WritingScreen.tsx` | ✅ |
| `src/components/writing/ShortAnswerQuestion.tsx` | `client/src/exam/components/ShortAnswerQuestion.tsx` | ✅ |
| `src/components/writing/EssayQuestion.tsx` | `client/src/exam/components/EssayQuestion.tsx` | ✅ |
| `src/components/writing/PassageBox.tsx` | (컴포넌트 내부에 인라인 구현) | ⏳ |
| `src/hooks/useAutoSave.ts` | `client/src/exam/hooks/useAutoSave.ts` | ✅ |
| `src/hooks/useKoreanCharCount.ts` | `client/src/exam/hooks/useKoreanCharCount.ts` | ✅ |
| `src/api/writingApi.ts` | `client/src/api/examApi.ts` (통합) | ✅ |

### 비고
- 문서에서 `src/components/screens/`, `src/components/writing/` 구조를 사용하나, 실제 구현은 `client/src/exam/pages/`와 `client/src/exam/components/`로 재구성됨
- `PassageBox.tsx`는 독립 컴포넌트로 분리되지 않고 ShortAnswerQuestion/EssayQuestion 내부에서 지문 박스를 직접 렌더링
- `writingApi.ts`는 별도 파일 없이 `examApi.ts`에 통합됨
- 쓰기 영역은 TOPIK II 전용 (TOPIK I에는 쓰기 없음)
