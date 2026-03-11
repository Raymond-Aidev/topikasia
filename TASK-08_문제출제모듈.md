# TASK-08: 문제 출제 모듈 (문제은행 Import 방식)

> 연관 PRD: QUESTION-01~17
> 참고 화면: SCR-Q01 ~ SCR-Q07
> 연관 문서: [TASK-06 어드민 회원관리·시험세트배정](./TASK-06_어드민_회원관리_시험세트배정.md) · [TASK-07 어드민 운영모니터링](./TASK-07_어드민_운영모니터링.md)
> 우선순위: Phase 1 (문제 Import·세트 구성·IBT 업로드)

---

## 목표

출제자(어드민)가 **문제은행(Question Bank)에서 유형별로 문제를 Import**하여
영역별 시험세트를 구성하고, IBT 시스템에 업로드(활성화)한다.
응시자는 배정된 세트로만 시험에 응시할 수 있다 (TASK-06 참조).

> **핵심 설계 원칙**
> - 문항을 직접 입력하는 폼 방식 **사용하지 않음**
> - 유형별 [문제 불러오기] 버튼 → 문제은행 API 호출 → 문항 Import
> - 문항 유형 수(기본 15개)는 설정 파일에서 **변경 가능**
> - 문제은행 API는 향후 제공 예정; 본 문서에서 인터페이스 계약(Contract) 정의

---

## 1. 전체 Import·구성 흐름

```
[출제자 / 어드민]

  Step 1. 유형별 문제 불러오기 (SCR-Q01)
    ├── 15개 유형 목록 표시 (설정에 따라 가감 가능)
    ├── 유형별 [문제 불러오기] 버튼 클릭
    │   └── 문제은행 API 호출 (GET /api/question-bank/questions?typeCode=...)
    │       └── 문항 목록 로드 → 페이지 내 미리보기 가능
    └── 불러온 문항 중 원하는 항목 선택 → 세션 스토어에 저장

  Step 2. 시험세트 구성 (SCR-Q05)
    ├── 새 세트 생성 (이름·유형·설명)
    ├── 영역별(듣기/쓰기/읽기) Import된 문항 선택 + 순서 배치 (dnd-kit)
    ├── 영역별 시험 시간 설정
    └── 세트 저장 → 상태: DRAFT

  Step 3. 미리보기 확인 (SCR-Q03)
    └── 실제 응시 화면과 동일한 UI로 전 문항 미리보기

  Step 4. IBT 업로드 (SCR-Q07)
    ├── 세트 최종 검토 (문항 수·영역 구성 검증)
    └── [업로드] → 상태: DRAFT → ACTIVE

  Step 5. 어드민에서 회원에게 세트 배정 (→ TASK-06 SCR-A04 참조)
```

---

## 2. 문항 유형 설정 (Configurable QuestionTypeConfig)

### 2-1. 설정 파일

```typescript
// src/question-module/config/questionTypes.config.ts

export type SectionType = "LISTENING" | "WRITING" | "READING";

export interface QuestionTypeConfig {
  code: string;           // 내부 유형 코드 (고유)
  name: string;           // 화면 표시 이름
  section: SectionType;   // 해당 영역
  bankTypeCode: string;   // 문제은행 API에서 사용하는 type 코드
  enabled: boolean;       // false면 화면에서 숨김
  sortOrder: number;      // 화면 표시 순서
}

// ─── 기본 15개 유형 (변경 가능) ───────────────────────────────────
export const DEFAULT_QUESTION_TYPES: QuestionTypeConfig[] = [
  // 듣기 영역 (4개)
  { code: "LISTEN_MCQ_SINGLE",  name: "듣기 - 4지선다 단일 선택",  section: "LISTENING", bankTypeCode: "LISTEN_MCQ_SINGLE",  enabled: true, sortOrder: 1  },
  { code: "LISTEN_MCQ_MULTI",   name: "듣기 - 4지선다 복수 선택",  section: "LISTENING", bankTypeCode: "LISTEN_MCQ_MULTI",   enabled: true, sortOrder: 2  },
  { code: "LISTEN_DIALOGUE",    name: "듣기 - 대화 유형",          section: "LISTENING", bankTypeCode: "LISTEN_DIALOGUE",    enabled: true, sortOrder: 3  },
  { code: "LISTEN_SET",         name: "듣기 - 지문 세트",          section: "LISTENING", bankTypeCode: "LISTEN_SET",         enabled: true, sortOrder: 4  },

  // 쓰기 영역 (3개)
  { code: "WRITE_SHORT_ANSWER", name: "쓰기 - 단답형 (ㄱ/ㄴ)",    section: "WRITING",   bankTypeCode: "WRITE_SHORT_ANSWER", enabled: true, sortOrder: 5  },
  { code: "WRITE_ESSAY_MED",    name: "쓰기 - 중급 서술형",        section: "WRITING",   bankTypeCode: "WRITE_ESSAY_MED",    enabled: true, sortOrder: 6  },
  { code: "WRITE_ESSAY_ADV",    name: "쓰기 - 고급 서술형",        section: "WRITING",   bankTypeCode: "WRITE_ESSAY_ADV",    enabled: true, sortOrder: 7  },

  // 읽기 영역 (8개)
  { code: "READ_MCQ_SINGLE",    name: "읽기 - 4지선다 단일 선택",  section: "READING",   bankTypeCode: "READ_MCQ_SINGLE",    enabled: true, sortOrder: 8  },
  { code: "READ_MCQ_MULTI",     name: "읽기 - 4지선다 복수 선택",  section: "READING",   bankTypeCode: "READ_MCQ_MULTI",     enabled: true, sortOrder: 9  },
  { code: "READ_DROPDOWN",      name: "읽기 - 드롭다운 선택",      section: "READING",   bankTypeCode: "READ_DROPDOWN",      enabled: true, sortOrder: 10 },
  { code: "READ_ORDERING",      name: "읽기 - 문장 배열",          section: "READING",   bankTypeCode: "READ_ORDERING",      enabled: true, sortOrder: 11 },
  { code: "READ_INSERT_POS",    name: "읽기 - 삽입 위치 선택",     section: "READING",   bankTypeCode: "READ_INSERT_POS",    enabled: true, sortOrder: 12 },
  { code: "READ_BLANK_FILL",    name: "읽기 - 빈칸 채우기",        section: "READING",   bankTypeCode: "READ_BLANK_FILL",    enabled: true, sortOrder: 13 },
  { code: "READ_MAIN_IDEA",     name: "읽기 - 주제·주장 파악",     section: "READING",   bankTypeCode: "READ_MAIN_IDEA",     enabled: true, sortOrder: 14 },
  { code: "READ_MATCH_INFO",    name: "읽기 - 정보 일치·불일치",   section: "READING",   bankTypeCode: "READ_MATCH_INFO",    enabled: true, sortOrder: 15 },
];
```

### 2-2. 유형 수 변경 방법

유형 수는 `DEFAULT_QUESTION_TYPES` 배열을 수정하여 조정한다.

| 변경 유형 | 방법 |
|-----------|------|
| 유형 추가 | 배열에 새 `QuestionTypeConfig` 항목 추가 |
| 유형 비활성화 | `enabled: false` 로 변경 (화면에서 숨김, API 호출 안 함) |
| 유형 삭제 | 배열에서 항목 제거 |
| 표시 순서 변경 | `sortOrder` 값 조정 |

> **Phase 2 고려**: DB 기반 설정 관리 (어드민 화면에서 유형 목록 편집 가능)로 확장 예정 (SCR-A09).

### 2-3. 유형 설정 Hook

```typescript
// src/question-module/hooks/useQuestionTypes.ts
import { DEFAULT_QUESTION_TYPES } from "../config/questionTypes.config";

export function useQuestionTypes(section?: SectionType) {
  const allTypes = DEFAULT_QUESTION_TYPES.filter(t => t.enabled);
  const types = section
    ? allTypes.filter(t => t.section === section)
    : allTypes;
  return types.sort((a, b) => a.sortOrder - b.sortOrder);
}
```

---

## 3. 문제은행 API 인터페이스 (향후 제공)

> 현재 문제은행 시스템은 미구현 상태이다. 아래 Contract를 기준으로 Mock API 또는 실제 API와 교체한다.

### 3-1. API 계약 (Contract)

```typescript
// src/question-module/api/questionBankApi.ts

/** 문제은행 조회 요청 파라미터 */
export interface QuestionBankQuery {
  typeCode: string;               // 유형 코드 (QuestionTypeConfig.bankTypeCode)
  difficulty?: "EASY" | "MEDIUM" | "HARD" | "ALL";
  keyword?: string;               // 키워드 검색
  count?: number;                 // 페이지당 개수 (기본: 20)
  page?: number;                  // 페이지 번호 (기본: 1)
}

/** 문제은행에서 반환하는 문항 항목 */
export interface QuestionBankItem {
  bankId: string;                 // 문제은행 고유 ID
  typeCode: string;               // 유형 코드
  section: SectionType;           // 영역
  difficulty: "EASY" | "MEDIUM" | "HARD";
  preview: string;                // 지시문 앞 100자 (목록 표시용)
  hasAudio: boolean;              // 오디오 파일 포함 여부
  hasImage: boolean;              // 이미지 포함 여부
  createdAt: string;              // 생성일시 (ISO 8601)
  usageCount: number;             // 이전 시험세트 사용 횟수
}

/** 문제은행 조회 응답 */
export interface QuestionBankResponse {
  items: QuestionBankItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** 문항 상세 조회 응답 (미리보기용) */
export interface QuestionBankDetail extends QuestionBankItem {
  instruction: string;            // 전체 지시문
  passageText?: string;           // 지문 텍스트
  audioUrl?: string;              // 오디오 파일 URL
  imageUrl?: string;              // 이미지 URL
  options?: { label: string; text: string }[];  // 선택지
  correctAnswer?: string | string[];            // 정답 (MCQ 등)
  modelAnswer?: string;           // 모범 답안 (서술형)
  scoringCriteria?: string;       // 채점 기준
}

// ─── API 엔드포인트 ──────────────────────────────────────────────
// GET  /api/question-bank/questions          → QuestionBankResponse
// GET  /api/question-bank/questions/:bankId  → QuestionBankDetail
//
// Mock URL (개발 중): /api/mock/question-bank/questions
```

### 3-2. Mock 구현 (개발/테스트용)

```typescript
// src/question-module/api/questionBankMock.ts
import { QuestionBankQuery, QuestionBankResponse } from "./questionBankApi";

export async function fetchQuestionsFromBank(
  query: QuestionBankQuery
): Promise<QuestionBankResponse> {
  // 실제 API 제공 전까지 Mock 데이터 반환
  const mockItems = Array.from({ length: query.count ?? 20 }, (_, i) => ({
    bankId: `MOCK-${query.typeCode}-${i + 1}`,
    typeCode: query.typeCode,
    section: "READING" as const,
    difficulty: "MEDIUM" as const,
    preview: `[Mock] ${query.typeCode} 유형 문항 ${i + 1}번 - 지시문 미리보기`,
    hasAudio: query.typeCode.startsWith("LISTEN"),
    hasImage: false,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  }));
  return { items: mockItems, total: 100, page: query.page ?? 1, pageSize: query.count ?? 20 };
}
```

---

## 4. 유형별 문제 불러오기 화면 (SCR-Q01)

### 4-1. UI 명세

```
┌──────────────────────────────────────────────────────────────────────┐
│  문제 불러오기 (문제은행 Import)          [시험세트 구성으로 →]      │
├──────────────────────────────────────────────────────────────────────┤
│  난이도 필터: ○ 전체  ○ 상  ● 중  ○ 하    키워드: [___________]   │
├──────────────────────────────────────────────────────────────────────┤
│  ── 듣기 영역 ──────────────────────────────────────────────────── │
│                                                                      │
│  유형                           불러온 문항   선택   액션           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 듣기 - 4지선다 단일 선택     12문항 로드됨  3 선택  [문제 불러오기] │
│  │ 듣기 - 4지선다 복수 선택      0문항          0 선택  [문제 불러오기] │
│  │ 듣기 - 대화 유형              8문항 로드됨   2 선택  [문제 불러오기] │
│  │ 듣기 - 지문 세트              0문항          0 선택  [문제 불러오기] │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ── 쓰기 영역 ──────────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 쓰기 - 단답형 (ㄱ/ㄴ)         5문항 로드됨  1 선택  [문제 불러오기] │
│  │ 쓰기 - 중급 서술형             3문항 로드됨  1 선택  [문제 불러오기] │
│  │ 쓰기 - 고급 서술형             3문항 로드됨  1 선택  [문제 불러오기] │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ── 읽기 영역 ──────────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 읽기 - 4지선다 단일 선택     20문항 로드됨  8 선택  [문제 불러오기] │
│  │ 읽기 - 4지선다 복수 선택      0문항          0 선택  [문제 불러오기] │
│  │ 읽기 - 드롭다운 선택         15문항 로드됨   5 선택  [문제 불러오기] │
│  │ 읽기 - 문장 배열              0문항          0 선택  [문제 불러오기] │
│  │ 읽기 - 삽입 위치 선택         0문항          0 선택  [문제 불러오기] │
│  │ 읽기 - 빈칸 채우기           10문항 로드됨   3 선택  [문제 불러오기] │
│  │ 읽기 - 주제·주장 파악         8문항 로드됨   3 선택  [문제 불러오기] │
│  │ 읽기 - 정보 일치·불일치       6문항 로드됨   2 선택  [문제 불러오기] │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  선택 합계: 듣기 5 | 쓰기 3 | 읽기 21     [세트 구성으로 이동 →]    │
└──────────────────────────────────────────────────────────────────────┘
```

### 4-2. 문제 불러오기 드로어 (SCR-Q02)

[문제 불러오기] 버튼 클릭 시 우측 드로어(Drawer) 열림:

```
┌──────── [읽기 - 드롭다운 선택] 문제 불러오기 ─────────────────── ×  ┐
│  난이도: ○전체 ○상 ●중 ○하    키워드: [____________]  [검색]         │
├──────────────────────────────────────────────────────────────────────┤
│ ☑  #1  빈칸에 들어갈 말로 가장 알맞은 것은? [중] 🖼  [미리보기]     │
│ ☑  #2  다음을 읽고 빈칸에 가장 알맞은... [중]          [미리보기]   │
│ ☐  #3  문장 속 빈칸에 들어갈 단어를... [상] 🔊         [미리보기]   │
│ ☑  #4  아래 지문에서 빈칸 (  )에 들어갈... [하]        [미리보기]   │
│ ☐  #5  다음 글에서 알맞은 표현을 고르시오. [중]         [미리보기]   │
│ ─ ─ ─ ─  (무한 스크롤) ─ ─ ─ ─                                     │
├──────────────────────────────────────────────────────────────────────┤
│  전체 15개 중 3개 선택됨                [취소]  [선택 완료 (3개) →]  │
└──────────────────────────────────────────────────────────────────────┘
```

### 4-3. QuestionBankImporter 컴포넌트

```typescript
// src/question-module/components/QuestionBankImporter.tsx
import { useState, useCallback } from "react";
import { useQuestionTypes } from "../hooks/useQuestionTypes";
import { fetchQuestionsFromBank } from "../api/questionBankMock"; // 실제 API로 교체
import type { QuestionBankItem } from "../api/questionBankApi";

interface Props {
  onImportComplete: (typeCode: string, items: QuestionBankItem[]) => void;
}

export function QuestionBankImporter({ onImportComplete }: Props) {
  const allTypes = useQuestionTypes();          // 설정에서 enabled 유형만
  const [loadedMap, setLoadedMap] = useState<Record<string, QuestionBankItem[]>>({});
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleImport = useCallback(async (typeCode: string) => {
    setLoadingType(typeCode);
    try {
      const result = await fetchQuestionsFromBank({ typeCode, count: 20, page: 1 });
      setLoadedMap(prev => ({ ...prev, [typeCode]: result.items }));
    } finally {
      setLoadingType(null);
    }
  }, []);

  return (
    <div className="question-bank-importer">
      {["LISTENING", "WRITING", "READING"].map(section => (
        <section key={section}>
          <h3>{sectionLabel[section]}</h3>
          <table>
            <tbody>
              {allTypes
                .filter(t => t.section === section)
                .map(type => (
                  <QuestionTypeRow
                    key={type.code}
                    config={type}
                    loadedItems={loadedMap[type.code] ?? []}
                    isLoading={loadingType === type.code}
                    onImport={() => handleImport(type.code)}
                    onSelectionChange={items => onImportComplete(type.code, items)}
                  />
                ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

const sectionLabel: Record<string, string> = {
  LISTENING: "듣기 영역",
  WRITING: "쓰기 영역",
  READING: "읽기 영역",
};
```

### 4-4. QuestionTypeRow 컴포넌트

```typescript
// src/question-module/components/QuestionTypeRow.tsx
interface Props {
  config: QuestionTypeConfig;
  loadedItems: QuestionBankItem[];
  isLoading: boolean;
  onImport: () => void;
  onSelectionChange: (selected: QuestionBankItem[]) => void;
}

export function QuestionTypeRow({
  config, loadedItems, isLoading, onImport, onSelectionChange,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<QuestionBankItem[]>([]);

  const handleImportClick = () => {
    onImport();          // API 호출
    setDrawerOpen(true); // 드로어 열기
  };

  const handleSelectionDone = (items: QuestionBankItem[]) => {
    setSelected(items);
    onSelectionChange(items);
    setDrawerOpen(false);
  };

  return (
    <>
      <tr>
        <td>{config.name}</td>
        <td>{loadedItems.length > 0 ? `${loadedItems.length}문항 로드됨` : "0문항"}</td>
        <td>{selected.length} 선택</td>
        <td>
          <button onClick={handleImportClick} disabled={isLoading}>
            {isLoading ? "불러오는 중..." : "문제 불러오기"}
          </button>
        </td>
      </tr>
      {drawerOpen && (
        <QuestionSelectDrawer
          typeConfig={config}
          items={loadedItems}
          initialSelected={selected}
          onClose={() => setDrawerOpen(false)}
          onConfirm={handleSelectionDone}
        />
      )}
    </>
  );
}
```

### 4-5. Zustand Store (Import된 문항 관리)

```typescript
// src/question-module/store/importedQuestionsStore.ts
import { create } from "zustand";
import type { QuestionBankItem } from "../api/questionBankApi";

interface ImportedQuestionsState {
  // typeCode → 선택된 문항 배열
  selectedByType: Record<string, QuestionBankItem[]>;
  setSelected: (typeCode: string, items: QuestionBankItem[]) => void;
  clearAll: () => void;
  getAllSelected: () => QuestionBankItem[];
  getSelectedBySection: (section: string) => QuestionBankItem[];
}

export const useImportedQuestionsStore = create<ImportedQuestionsState>(
  (set, get) => ({
    selectedByType: {},

    setSelected: (typeCode, items) =>
      set(state => ({
        selectedByType: { ...state.selectedByType, [typeCode]: items },
      })),

    clearAll: () => set({ selectedByType: {} }),

    getAllSelected: () =>
      Object.values(get().selectedByType).flat(),

    getSelectedBySection: (section) =>
      Object.entries(get().selectedByType)
        .filter(([code]) =>
          DEFAULT_QUESTION_TYPES.find(
            t => t.code === code && t.section === section
          )
        )
        .flatMap(([, items]) => items),
  })
);
```

---

## 5. 문항 미리보기 (SCR-Q03)

- 응시 화면 컴포넌트 재사용 (ListeningScreen, WritingScreen, ReadingScreen)
- 출제자 전용 오버레이: 정답 표시 토글 버튼 추가
- 드로어 내 [미리보기] 버튼 또는 세트 구성 화면에서 접근

```typescript
// src/question-module/components/QuestionPreview.tsx
interface Props {
  bankItem: QuestionBankDetail;
  showCorrectAnswer?: boolean;   // 출제자 전용 플래그 (기본: true)
}

export function QuestionPreview({ bankItem, showCorrectAnswer = true }: Props) {
  // 문제은행 Item → 응시 화면 Question 포맷 변환
  const question = mapBankItemToQuestion(bankItem);

  return (
    <div className="question-preview-wrapper">
      {showCorrectAnswer && (
        <div className="correct-answer-overlay">
          정답: {formatCorrectAnswer(bankItem.correctAnswer)}
        </div>
      )}
      <QuestionRenderer question={question} readOnly />
    </div>
  );
}
```

---

## 6. 시험세트 구성 (SCR-Q05)

SCR-Q01에서 Import·선택한 문항으로 세트를 구성한다.

### 6-1. UI 명세

```
┌──── 시험세트 구성 ────────────────────────────────────────────────────┐
│  세트명 *   [2026년 1회 TOPIK II 세트A_____________________]          │
│  시험 유형   ○ TOPIK I   ● TOPIK II                                   │
│  설명       [______________________________________________]           │
│                                                                       │
│  ─── 듣기 영역 (Import된 문항: 5개) ──────────────────────────────── │
│  시험 시간: [40] 분   목표 문항 수: [50] 문항                          │
│                                                                       │
│  선택된 문항 (드래그로 순서 조정)          Import 문항 풀             │
│  ┌──────────────────────────────────┐  ┌───────────────────────────┐ │
│  │ 1. [MCQ단일] 다음을 듣고...   ☰ │  │ 유형: [듣기-4지선다단일 ▼]  │ │
│  │ 2. [대화]    이어질 말로 가장 ☰ │  │ ┌───────────────────────┐  │ │
│  │ ── 여기에 드래그 ─────────────  │  │ │ 다음을 듣고 알맞은... │  │ │
│  └──────────────────────────────────┘  │ │         [+ 추가]      │  │ │
│  현재: 2 / 50 문항                      │ │ 빈칸에 들어갈 말로... │  │ │
│                                         │ │         [+ 추가]      │  │ │
│  ─── 쓰기 영역 (Import된 문항: 3개) ── │ └───────────────────────┘  │ │
│  (동일 구조)                             └───────────────────────────┘ │
│  ─── 읽기 영역 (Import된 문항: 21개) ──                               │
│  (동일 구조)                                                           │
│                                                                       │
│  ◀ [문제 불러오기로 돌아가기]  [저장 (DRAFT)]  [미리보기]  [IBT 업로드 →] │
└───────────────────────────────────────────────────────────────────────┘
```

### 6-2. 구현 요구사항

**Import 문항 풀 패널 (우측)**:
- SCR-Q01에서 선택된 문항 목록 표시 (유형별 필터)
- [+ 추가] → 좌측 세트 목록에 추가
- 이미 세트에 추가된 문항은 비활성화 표시

**세트 목록 패널 (좌측)**:
- dnd-kit `SortableContext`로 드래그 순서 조정
- [× 제거] → 해당 문항 세트에서 제거 (Import 풀로 반환)
- 영역별 목표 문항 수 대비 현재 문항 수 표시

**유효성 검사 (IBT 업로드 전)**:
- 듣기 영역: 오디오(`hasAudio: true`) 문항 포함 여부 확인
- 영역별 최소 문항 수 확인
- 정답 없는 MCQ 문항 경고 (문제은행 데이터 품질 이슈 대비)

### 6-3. API

```typescript
// 세트 저장 (생성/수정)
POST /api/question-module/exam-sets
PUT  /api/question-module/exam-sets/:id

// Body
interface ExamSetSaveBody {
  name: string;
  examType: "TOPIK_I" | "TOPIK_II";
  description?: string;
  sections: {
    LISTENING: { bankIds: string[]; durationMinutes: number };
    WRITING:   { bankIds: string[]; durationMinutes: number };
    READING:   { bankIds: string[]; durationMinutes: number };
  };
}

// bankIds: 문제은행 bankId 배열 (순서대로 저장)
// 업로드 시 실제 문항 데이터는 문제은행 API에서 재조회하여 스냅샷 저장
```

---

## 7. IBT 업로드 (SCR-Q07)

### 7-1. UI 명세

```
┌──── IBT 업로드 ──────────────────────────────────────────────────────┐
│  세트명: 2026년 1회 TOPIK II 세트A                                    │
│  유형: TOPIK II                                                       │
│                                                                       │
│  ✅ 듣기  50문항  (40분)   오디오 포함 ✅                            │
│  ✅ 쓰기   4문항  (50분)                                              │
│  ✅ 읽기  50문항  (70분)                                              │
│                                                                       │
│  ⚠️  경고 항목                                                        │
│  └─ 쓰기 3번 서술형 모범 답안이 문제은행에 등록되지 않았습니다.      │
│                                                                       │
│  업로드 시:                                                           │
│  1. 문제은행에서 최신 문항 데이터 스냅샷 저장                        │
│  2. 세트 상태: DRAFT → ACTIVE                                        │
│  3. 어드민 회원 배정 목록에 즉시 표시 (→ TASK-06 참조)              │
│                                                                       │
│            [취소]            [IBT 업로드 및 활성화 →]                │
└──────────────────────────────────────────────────────────────────────┘
```

### 7-2. 업로드 검증

```typescript
interface ValidationResult {
  passed: boolean;
  errors: string[];    // 차단 오류 (업로드 불가)
  warnings: string[];  // 경고 (업로드 가능하나 확인 권고)
}

function validateExamSet(set: ExamSetDraft): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 오류: 영역별 문항 없음
  if (set.sections.LISTENING.bankIds.length === 0)
    errors.push("듣기 영역 문항이 없습니다.");
  if (set.sections.WRITING.bankIds.length === 0)
    errors.push("쓰기 영역 문항이 없습니다.");
  if (set.sections.READING.bankIds.length === 0)
    errors.push("읽기 영역 문항이 없습니다.");

  // 오류: 듣기 문항에 오디오 없음
  set.sections.LISTENING.bankIds.forEach((id, i) => {
    const item = getBankItem(id);
    if (!item.hasAudio)
      errors.push(`듣기 ${i + 1}번 문항에 오디오 파일이 없습니다.`);
  });

  // 경고: 서술형 모범 답안 없음
  set.sections.WRITING.bankIds.forEach((id, i) => {
    const item = getBankItem(id);
    if (item.typeCode.includes("ESSAY") && !item.modelAnswer)
      warnings.push(`쓰기 ${i + 1}번 서술형 모범 답안이 없습니다.`);
  });

  return { passed: errors.length === 0, errors, warnings };
}
```

### 7-3. 업로드 API

```typescript
// IBT 업로드 (DRAFT → ACTIVE + 문항 스냅샷 저장)
POST /api/question-module/exam-sets/:id/upload

// Response
interface UploadResponse {
  success: boolean;
  examSetId: string;
  status: "ACTIVE";
  snapshotSavedAt: string;   // 문제은행 스냅샷 저장 시각
  activatedAt: string;
}

// 업로드 후 어드민 API에서 즉시 조회 가능 (TASK-06 연계)
GET /api/admin/exam-sets
// → status=ACTIVE 세트 목록 반환 (회원 배정 드롭다운용)
```

---

## 8. 어드민-출제 모듈 연계 흐름

```
[문제 출제 모듈]                          [어드민 (TASK-06)]

  SCR-Q01: 유형별 문제 불러오기
    └── 문제은행 API → 문항 Import
  SCR-Q05: 시험세트 구성 (DRAFT)
  SCR-Q07: IBT 업로드 → 상태: ACTIVE ──→ SCR-A06: 세트 목록에 즉시 표시
                                          SCR-A04: 회원 생성 시 세트 배정 드롭다운
                                          → 응시자 SCR-03: 배정된 1개 세트 표시
```

**관련 화면 연결:**
- SCR-Q07 업로드 완료 → `GET /api/admin/exam-sets` 갱신 → TASK-06 SCR-A04/A06에서 배정 가능
- 어드민이 SCR-A04에서 회원 생성 시 `assignedExamSetId` 드롭다운에 ACTIVE 세트만 표시
- 응시자 로그인 후 SCR-03에서 배정된 1개 세트만 표시 (TASK-01 연계)

---

## 9. 권한 분리

| 기능 | QUESTION_AUTHOR | ADMIN | SUPER_ADMIN |
|------|:-:|:-:|:-:|
| 문제은행 문항 불러오기 | ✅ | ✅ | ✅ |
| 시험세트 구성 (DRAFT) | ✅ | ✅ | ✅ |
| IBT 업로드 (ACTIVE) | ❌ | ✅ | ✅ |
| 회원에게 세트 배정 | ❌ | ✅ | ✅ |
| 유형 설정 변경 (Phase 2) | ❌ | ❌ | ✅ |

---


---

## ⚠️ ACID 상용서비스 구현 필수 항목

> 출처: `ACID_상용서비스_구현목록.md`
> 이 섹션의 항목은 상용 서비스 기준으로 **반드시 구현**해야 합니다.

---

### T1-05 (UI) | IBT 업로드 — 409 이중 업로드 차단 응답 처리

**대상**: `client/src/question-module/pages/IBTUploadPage.tsx` — `handleUpload` 함수

```typescript
// ✅ 서버 T1-05에서 이미 ACTIVE인 세트 업로드 시 409 반환
// 클라이언트에서 명확한 안내 UI 제공
const handleUpload = async () => {
  setIsUploading(true);
  try {
    await questionApi.post(`/question-module/exam-sets/${examSetId}/upload-ibt`, {
      sections: composedSections
    });
    toast.success("IBT 업로드가 완료되었습니다.");
    navigate("/question-module/sets");
  } catch (err: any) {
    if (err.response?.status === 409) {
      // ✅ 이미 업로드된 세트 → 재업로드 불가 안내
      Modal.error({
        title: "업로드 불가",
        content: "이미 업로드가 완료된 세트입니다. 새 세트를 생성하거나 관리자에게 문의하세요.",
        okText: "확인"
      });
    } else if (err.response?.status === 429) {
      // ✅ Redis 락 → 업로드 진행 중 안내 (T3-02)
      toast.warning("업로드가 이미 진행 중입니다. 잠시 후 다시 시도하세요.");
    } else {
      toast.error("업로드 중 오류가 발생했습니다. 다시 시도하세요.");
    }
  } finally {
    setIsUploading(false);
  }
};
```

---

### T3-02 (UI) | IBT 업로드 중복 요청 방지 — 버튼 비활성화

**대상**: `client/src/question-module/pages/IBTUploadPage.tsx` — 업로드 버튼

```tsx
// ✅ 업로드 진행 중 버튼 비활성화로 클라이언트 측 중복 요청 1차 방지
// (서버 Redis 락은 2차 방어선)
<Button
  type="primary"
  onClick={handleUpload}
  disabled={isUploading || !isValidComposition}
  loading={isUploading}
>
  {isUploading ? "업로드 중..." : "IBT 업로드"}
</Button>

// 업로드 상태 표시 (진행률 또는 스피너)
{isUploading && (
  <div className="upload-progress">
    <Spin size="large" />
    <p>문제은행에서 문항을 가져오는 중입니다. 잠시 기다려 주세요.</p>
    <p className="upload-warning">창을 닫거나 새로고침하지 마세요.</p>
  </div>
)}
```

---

### T2-03 (UI) | 시험세트 상태 표시 — 전환 가능 상태만 버튼 활성화

**대상**: `client/src/question-module/components/ExamSetStatusBadge.tsx`

```tsx
// ✅ 상태 전환 규칙 시각화 (서버 assertStatusTransition과 일치)
// DRAFT → ACTIVE 가능 / ACTIVE → ARCHIVED 가능 / ARCHIVED → 전환 불가

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:    ["ACTIVE"],
  UPLOADED: ["ACTIVE"],
  ACTIVE:   ["ARCHIVED"],
  ARCHIVED: [],
};

export function ExamSetActionButtons({ examSet }: { examSet: ExamSet }) {
  const allowedNext = STATUS_TRANSITIONS[examSet.status] ?? [];
  return (
    <div className="exam-set-actions">
      {allowedNext.includes("ACTIVE") && (
        <Button onClick={() => handleUploadIBT(examSet.id)}>
          IBT 업로드 (ACTIVE 전환)
        </Button>
      )}
      {allowedNext.includes("ARCHIVED") && (
        <Button danger onClick={() => handleArchive(examSet.id)}>
          보관 처리
        </Button>
      )}
      {allowedNext.length === 0 && (
        <Badge status="default" text="상태 변경 불가" />
      )}
    </div>
  );
}
```

## 10. 완료 조건 (Acceptance Criteria)

- [ ] `DEFAULT_QUESTION_TYPES` 배열에서 유형 수 변경 시 화면에 즉시 반영
- [ ] 비활성화(`enabled: false`) 유형은 화면에 표시되지 않고 API 호출 안 함
- [ ] 15개 유형별 [문제 불러오기] 버튼 클릭 → 문제은행 API(또는 Mock) 호출
- [ ] API 호출 중 로딩 상태 표시, 실패 시 에러 메시지 표시
- [ ] 드로어에서 문항 선택·해제 후 [선택 완료] → 유형별 선택 수 업데이트
- [ ] 드로어 내 [미리보기] → QuestionPreview 모달 (정답 오버레이 포함)
- [ ] 시험세트 구성: Import 문항 풀에서 세트로 추가, dnd-kit 순서 조정
- [ ] 시험세트 저장 시 `bankId` 배열로 서버 저장 (DRAFT 상태)
- [ ] IBT 업로드 전 유효성 검증 (오류/경고 표시)
- [ ] 업로드 성공 후 어드민 회원 배정 드롭다운에 즉시 표시 (TASK-06 연계)
- [ ] Mock API와 실제 API 교체 시 `fetchQuestionsFromBank` 함수 교체만으로 동작

---

## 11. 파일 구조

```
src/
├── question-module/
│   ├── config/
│   │   └── questionTypes.config.ts     ← 유형 수 변경 지점
│   ├── pages/
│   │   ├── QuestionBankImportPage.tsx  ← SCR-Q01 (NEW: 문제 불러오기)
│   │   ├── ExamSetListPage.tsx         ← SCR-Q04
│   │   ├── ExamSetComposePage.tsx      ← SCR-Q05
│   │   ├── ExamSetPreviewPage.tsx      ← SCR-Q03
│   │   └── ExamSetUploadPage.tsx       ← SCR-Q07
│   ├── components/
│   │   ├── QuestionBankImporter.tsx    ← 유형별 불러오기 목록
│   │   ├── QuestionTypeRow.tsx         ← 각 유형 행 (불러오기 버튼 포함)
│   │   ├── QuestionSelectDrawer.tsx    ← 드로어: 문항 목록 + 선택
│   │   ├── QuestionPreview.tsx         ← 미리보기 모달 (정답 오버레이)
│   │   ├── ExamSetComposer.tsx         ← 2열 드래그 UI
│   │   ├── ImportedQuestionsPanel.tsx  ← 우측 Import 문항 풀 패널
│   │   └── UploadValidationPanel.tsx   ← 검증 오류/경고 표시
│   ├── hooks/
│   │   ├── useQuestionTypes.ts         ← 설정 기반 유형 목록
│   │   └── useExamSetCompose.ts        ← 세트 구성 상태 관리
│   ├── store/
│   │   └── importedQuestionsStore.ts   ← Zustand: Import된 문항 관리
│   └── api/
│       ├── questionBankApi.ts          ← API 인터페이스 계약 (타입 정의)
│       ├── questionBankMock.ts         ← Mock 구현 (개발/테스트용)
│       └── examSetApi.ts               ← 세트 저장·업로드 API
```

---

## ✅ 구현 현황 (2026-03-10 기준)

### 완료된 항목
- [x] 문항 유형 설정 — 15개 유형 (듣기 4, 쓰기 3, 읽기 8), enabled/sortOrder — `question-module/config/questionTypes.config.ts`
- [x] 유형 설정 Hook — enabled 필터, 섹션별 필터, sortOrder 정렬 — `question-module/hooks/useQuestionTypes.ts`
- [x] 유형별 문제 불러오기 화면 (SCR-Q01) — 섹션별 그룹, 유형별 불러오기 버튼 — `question-module/pages/QuestionBankImportPage.tsx`
- [x] 문제 불러오기 드로어 (SCR-Q02) — 우측 드로어, 난이도/키워드 필터, 체크박스 선택 — `question-module/components/QuestionSelectDrawer.tsx`
- [x] 문항 미리보기 (SCR-Q03) — 상세 조회, 정답 토글, 해설 — `question-module/components/QuestionPreview.tsx`
- [x] 시험세트 구성 (SCR-Q05) — 2열 dnd-kit D&D, 메타데이터 폼 — `question-module/pages/ExamSetComposePage.tsx`
- [x] 시험세트 목록 — 상태 배지, 편집/업로드 액션 — `question-module/pages/ExamSetModuleListPage.tsx`
- [x] IBT 업로드 (SCR-Q07) — 유효성 검증, 진행바, 409/429 처리 — `question-module/pages/IBTUploadPage.tsx`
- [x] Import 문항 상태 관리 — Zustand (selectedByType, getSelectedBySection) — `question-module/store/importedQuestionsStore.ts`
- [x] 유형별 문제 불러오기 컴포넌트 — `question-module/components/QuestionBankImporter.tsx`
- [x] 유형 행 컴포넌트 — `question-module/components/QuestionTypeRow.tsx`
- [x] 세트 구성 드래그 UI — `question-module/components/ExamSetComposer.tsx`
- [x] 업로드 검증 패널 — `question-module/components/UploadValidationPanel.tsx`
- [x] 세트 CRUD + upload API — `question-module/api/examSetApi.ts`
- [x] 문제은행 API 인터페이스 — `question-module/api/questionBankApi.ts`
- [x] Mock 구현 — `question-module/api/questionBankMock.ts`
- [x] T1-05: 409 이중 업로드 차단 응답 처리 — `question-module/pages/IBTUploadPage.tsx`
- [x] T3-02: 업로드 중 버튼 비활성화 + 진행 상태 표시 — `question-module/pages/IBTUploadPage.tsx`

### 미완료 항목 (Phase 2)
- [ ] ExamSetPreviewPage.tsx — 전체 미리보기 전용 페이지 (현재 QuestionPreview 컴포넌트로 개별 미리보기만 지원)
- [ ] ImportedQuestionsPanel.tsx — 우측 Import 문항 풀 패널 별도 분리 (현재 ExamSetComposer 내부)
- [ ] useExamSetCompose.ts — 세트 구성 상태 관리 Hook 별도 분리
- [ ] ExamSetStatusBadge.tsx (question-module 내) — 상태 전환 규칙 시각화 (T2-03, 문서 ACID 항목)
- [ ] DB 기반 유형 설정 관리 (어드민 화면에서 편집 가능, SCR-A09)

### 실제 파일 경로 (문서 vs 구현)
| 문서 경로 | 실제 경로 | 상태 |
|-----------|-----------|------|
| `question-module/config/questionTypes.config.ts` | `question-module/config/questionTypes.config.ts` | ✅ |
| `question-module/pages/QuestionBankImportPage.tsx` | `question-module/pages/QuestionBankImportPage.tsx` | ✅ |
| `question-module/pages/ExamSetListPage.tsx` (SCR-Q04) | `question-module/pages/ExamSetModuleListPage.tsx` | ✅ |
| `question-module/pages/ExamSetComposePage.tsx` | `question-module/pages/ExamSetComposePage.tsx` | ✅ |
| `question-module/pages/ExamSetPreviewPage.tsx` | (미구현) | ⏳ |
| `question-module/pages/ExamSetUploadPage.tsx` | `question-module/pages/IBTUploadPage.tsx` | ✅ |
| `question-module/components/QuestionBankImporter.tsx` | `question-module/components/QuestionBankImporter.tsx` | ✅ |
| `question-module/components/QuestionTypeRow.tsx` | `question-module/components/QuestionTypeRow.tsx` | ✅ |
| `question-module/components/QuestionSelectDrawer.tsx` | `question-module/components/QuestionSelectDrawer.tsx` | ✅ |
| `question-module/components/QuestionPreview.tsx` | `question-module/components/QuestionPreview.tsx` | ✅ |
| `question-module/components/ExamSetComposer.tsx` | `question-module/components/ExamSetComposer.tsx` | ✅ |
| `question-module/components/ImportedQuestionsPanel.tsx` | (ExamSetComposer 내부 인라인) | ⏳ |
| `question-module/components/UploadValidationPanel.tsx` | `question-module/components/UploadValidationPanel.tsx` | ✅ |
| `question-module/hooks/useQuestionTypes.ts` | `question-module/hooks/useQuestionTypes.ts` | ✅ |
| `question-module/hooks/useExamSetCompose.ts` | (미구현) | ⏳ |
| `question-module/store/importedQuestionsStore.ts` | `question-module/store/importedQuestionsStore.ts` | ✅ |
| `question-module/api/questionBankApi.ts` | `question-module/api/questionBankApi.ts` | ✅ |
| `question-module/api/questionBankMock.ts` | `question-module/api/questionBankMock.ts` | ✅ |
| `question-module/api/examSetApi.ts` | `question-module/api/examSetApi.ts` | ✅ |

### 비고
- 문서에서 `ExamSetListPage.tsx`로 명시된 세트 목록은 `ExamSetModuleListPage.tsx`로 네이밍 변경 (admin의 ExamSetListPage와 구분)
- 문서에서 `ExamSetUploadPage.tsx`로 명시된 업로드 페이지는 `IBTUploadPage.tsx`로 네이밍 변경
- ExamSetPreviewPage(전체 세트 미리보기 전용 페이지)는 미구현 — 현재 QuestionPreview 컴포넌트로 개별 문항 미리보기만 가능
- ImportedQuestionsPanel, useExamSetCompose는 별도 분리 없이 ExamSetComposer/ExamSetComposePage 내부에 통합
- T2-03(ExamSetStatusBadge 상태 전환 규칙)은 question-module 내에는 미구현, admin/components/ExamSetStatusBadge.tsx에서 유사 기능 존재
