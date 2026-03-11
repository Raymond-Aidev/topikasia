# TASK-02: 듣기 영역 구현

> 연관 PRD: LISTEN-01~07
> 참고 화면: SCR-05(영역 대기), SCR-06(듣기 문제)
> 연관 문서: [TASK-08 문제 출제 모듈](./TASK-08_문제출제모듈.md) — 듣기 문항(오디오 포함) Import 연계
> 우선순위: Phase 1 (MVP 필수)

---

## 목표

TOPIK I·II 공통 듣기 영역을 구현한다. 오디오 자동 재생, 재생 횟수 제한,
4지선다 선택, 이미지 포함 문항, 이전/다음 내비게이션을 포함한다.

---

## 1. 화면 구조

```
┌──────────────────────────────────────────────────────────────────────┐
│  001007155 │ 한국어능력시험(TOPIK) IBT - TOPIK I │ ⏱ 남은 시험 시간 00:38:24 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [듣기]                                                  3 / 30     │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  ◀ ──────────────────────────── ▶   재생 (1/2회)                   │
│                                                                      │
│  3. 다음을 듣고 물음에 답하십시오.                                    │
│                                                                      │
│  [이미지 자료 (선택적)]                                               │
│                                                                      │
│  ① 선택지 A                                                          │
│  ② 선택지 B    ← 선택됨 (파란 배경)                                  │
│  ③ 선택지 C                                                          │
│  ④ 선택지 D                                                          │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  [< 이전]                                               [다음 >]    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. 컴포넌트 설계

### ListeningScreen (최상위 화면)
```typescript
// 상태
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answers, setAnswers] = useState<Record<string, number[]>>({});
const [playCount, setPlayCount] = useState<Record<string, number>>({});

// 데이터
const questions: ListeningQuestion[];  // 서버에서 로드
const MAX_PLAY_COUNT = 2;              // 최대 재생 횟수 (설정값)
```

### AudioPlayer 컴포넌트
```typescript
interface AudioPlayerProps {
  audioUrl // 문제은행(TASK-08)에서 Import된 오디오 파일 URL: string;
  questionId: string;
  maxPlayCount: number;         // 재생 횟수 제한
  playCount: number;            // 현재 재생 횟수
  onPlayStart: () => void;      // 재생 시작 → playCount 증가
  autoPlay: boolean;            // 문항 진입 시 자동 재생 여부
}
```

**UI 요소**:
- 재생 진행 바 (progress bar)
- 재생/일시정지 버튼
- 현재 재생 횟수 표시: "(N/M회)"
- 재생 횟수 초과 시 재생 버튼 비활성화 + 안내 문구

**구현 세부사항**:
- `<audio>` 태그 또는 Howler.js 사용
- 오디오 파일: AWS S3 스트리밍 URL
- 문항 이동 시 기존 오디오 정지
- 자동 재생: 문항 진입 즉시 오디오 시작

### AnswerOptions 컴포넌트
```typescript
interface AnswerOptionsProps {
  options: { id: number; text: string; imageUrl?: string }[];
  selectedIds: number[];
  maxSelect: 1 | 2;            // 단일 선택=1, 복수=2 (듣기는 항상 1)
  onChange: (ids: number[]) => void;
}
```

**UI 요소**:
- ① ② ③ ④ 라디오 버튼 스타일
- 선택 시 파란 배경 강조 (`#E3F2FD` 또는 `#1565C0 text-white`)
- 이미지 포함 선택지 지원 (이미지 + 텍스트 혼합)
- 4개 고정 (TOPIK 표준), 세로 배치

---

## 3. 데이터 타입

```typescript
interface ListeningQuestion {
  questionId: string;
  questionNumber: number;
  section: "LISTENING";
  questionType: "MCQ_SINGLE";
  instruction: string;          // "다음을 듣고 물음에 답하십시오."
  audioUrl: string;             // 오디오 파일 URL
  imageUrl?: string;            // 선택적 이미지 자료
  passageText?: string;         // 대본 (시험 중 비공개, 복습용)
  options: {
    id: number;
    text: string;
    imageUrl?: string;
  }[];
  maxAudioPlay: number;         // 최대 재생 횟수
}

interface ListeningAnswer {
  questionId: string;
  selectedOption: number;       // 선택한 선택지 ID
  savedAt: string;              // ISO8601
}
```

---

## 4. 오디오 재생 제어 로직

```typescript
// useAudioPlayer.ts (Custom Hook)
function useAudioPlayer(audioUrl: string, questionId: string, maxPlay: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [canPlay, setCanPlay] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const play = useCallback(() => {
    if (playCount >= maxPlay) return;       // 재생 횟수 초과 차단
    audioRef.current?.play();
    setPlayCount(prev => {
      const next = prev + 1;
      if (next >= maxPlay) setCanPlay(false);
      return next;
    });
    setIsPlaying(true);
  }, [playCount, maxPlay]);

  // 문항 변경 시 리셋
  useEffect(() => {
    audioRef.current?.pause();
    setPlayCount(0);
    setCanPlay(true);
    setIsPlaying(false);
  }, [questionId]);

  // 자동 재생
  useEffect(() => {
    if (audioUrl) play();
  }, [audioUrl]);

  return { isPlaying, playCount, canPlay, play, audioRef };
}
```

---

## 5. 답안 저장 로직

```typescript
// 답안 선택 시 즉시 로컬 저장 + 서버 동기화
const handleAnswerChange = async (questionId: string, optionId: number) => {
  // 1. 로컬 상태 업데이트
  setAnswers(prev => ({ ...prev, [questionId]: [optionId] }));

  // 2. IndexedDB 임시 저장 (네트워크 오류 대비)
  await saveAnswerLocal(questionId, [optionId]);

  // 3. 서버 비동기 저장 (실패해도 로컬은 유지)
  saveAnswerRemote(questionId, [optionId]).catch(console.error);
};

// API
PATCH /api/exam/answers
Body: { questionId: string, selectedOptions: number[], section: "LISTENING" }
```

---

## 6. 문항 내비게이션

```typescript
const handleNext = () => {
  if (currentQuestionIndex < questions.length - 1) {
    setCurrentQuestionIndex(prev => prev + 1);
  } else {
    // 마지막 문항 → 답안 제출 화면으로
    navigate("/exam/submit/listening");
  }
};

const handlePrev = () => {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(prev => prev - 1);
  }
};
```

---

## 7. 시간 만료 자동 제출

```typescript
// 타이머 만료 시
useEffect(() => {
  if (remainingSeconds <= 0) {
    autoSubmitSection("LISTENING");
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

- [x] 듣기 문항 목록 서버에서 로드 및 렌더링
- [x] 문항 진입 시 오디오 자동 재생
- [x] 최대 N회 재생 제한 적용 (초과 시 재생 버튼 비활성화)
- [x] 4지선다 선택 및 선택 상태 시각적 강조
- [x] 이미지가 포함된 문항 정상 렌더링
- [x] 이전/다음 버튼 내비게이션
- [x] 문항 이동 시 오디오 정지 및 재생 횟수 리셋
- [x] 답안 선택 즉시 로컬+서버 저장
- [x] 상단 헤더 남은 시험 시간 실시간 감소
- [x] 시간 만료 시 자동 제출 후 다음 영역 대기 화면 전환

---

## 9. 파일 구조

```
src/
├── components/screens/
│   └── ListeningScreen.tsx
├── components/listening/
│   ├── AudioPlayer.tsx
│   └── AnswerOptions.tsx
├── hooks/
│   └── useAudioPlayer.ts
└── api/
    └── listeningApi.ts
```

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] ListeningScreen 최상위 화면 — 문항 목록 렌더링, 내비게이션 — `client/src/exam/pages/ListeningScreen.tsx`
- [x] AudioPlayer 컴포넌트 — 오디오 자동 재생, 재생 횟수 제한 UI — `client/src/exam/components/AudioPlayer.tsx`
- [x] MCQQuestion 컴포넌트 — 4지선다 선택, 선택 상태 강조 (#E3F2FD) — `client/src/exam/components/MCQQuestion.tsx`
- [x] useAudioPlayer 커스텀 훅 — 재생 횟수 제한, 문항 변경 시 리셋 — `client/src/exam/hooks/useAudioPlayer.ts`
- [x] useAutoSave 커스텀 훅 — IndexedDB + 서버 동기화, 지수 백오프 재시도 — `client/src/exam/hooks/useAutoSave.ts`
- [x] DexieDB — IndexedDB 임시 저장 — `client/src/exam/store/dexieDb.ts`
- [x] 문항 진입 시 오디오 자동 재생 (Howler.js)
- [x] 최대 N회 재생 제한 (초과 시 재생 버튼 비활성화)
- [x] 이미지 포함 문항 지원
- [x] 이전/다음 내비게이션
- [x] 문항 이동 시 오디오 정지
- [x] 상단 헤더 남은 시험 시간 실시간 감소
- [x] 시간 만료 시 자동 제출
- [x] T2-01 ACID: 지수 백오프 재시도 (5회, 최대 30초)
- [x] T3-03 ACID: NetworkStatusBanner 연동

### 미완료 항목 (Phase 2)
- [ ] AnswerOptions 별도 컴포넌트 분리 (현재 MCQQuestion에 통합)
- [ ] listeningApi.ts 별도 파일 분리 (현재 examApi.ts에 통합)

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `src/components/screens/ListeningScreen.tsx` | `client/src/exam/pages/ListeningScreen.tsx` | ✅ |
| `src/components/listening/AudioPlayer.tsx` | `client/src/exam/components/AudioPlayer.tsx` | ✅ |
| `src/components/listening/AnswerOptions.tsx` | `client/src/exam/components/MCQQuestion.tsx` (통합) | ✅ |
| `src/hooks/useAudioPlayer.ts` | `client/src/exam/hooks/useAudioPlayer.ts` | ✅ |
| `src/hooks/useAutoSave.ts` | `client/src/exam/hooks/useAutoSave.ts` | ✅ |
| `src/api/listeningApi.ts` | `client/src/api/examApi.ts` (통합) | ✅ |
| (IndexedDB 저장소) | `client/src/exam/store/dexieDb.ts` | ✅ |

### 비고
- 문서에서 `src/components/screens/`, `src/components/listening/` 구조를 사용하나, 실제 구현은 `client/src/exam/pages/`와 `client/src/exam/components/`로 재구성됨
- `AnswerOptions` 컴포넌트는 독립 파일로 분리되지 않고 `MCQQuestion.tsx`에 선택지 렌더링이 통합됨 (읽기 영역 MCQQuestion과 공유)
- `listeningApi.ts`는 별도 파일 없이 `examApi.ts`에 통합됨
- IndexedDB 저장은 Dexie.js 라이브러리 기반으로 `dexieDb.ts`에서 관리됨
