// ─── 문제 유형 설정 ─────────────────────────────────────────

export interface QuestionTypeConfig {
  code: string;
  name: string;
  section: 'LISTENING' | 'WRITING' | 'READING';
  bankTypeCode: string;
  enabled: boolean;
  sortOrder: number;
}

export const DEFAULT_QUESTION_TYPES: QuestionTypeConfig[] = [
  // ── 듣기 (LISTENING) ──
  {
    code: 'L_MCQ_SINGLE',
    name: '듣기 단일선택',
    section: 'LISTENING',
    bankTypeCode: 'L_MCQ_SINGLE',
    enabled: true,
    sortOrder: 1,
  },
  {
    code: 'L_MCQ_MULTI',
    name: '듣기 복수선택',
    section: 'LISTENING',
    bankTypeCode: 'L_MCQ_MULTI',
    enabled: true,
    sortOrder: 2,
  },
  {
    code: 'L_DIALOGUE',
    name: '듣기 대화완성',
    section: 'LISTENING',
    bankTypeCode: 'L_DIALOGUE',
    enabled: true,
    sortOrder: 3,
  },
  {
    code: 'L_SET',
    name: '듣기 세트문항',
    section: 'LISTENING',
    bankTypeCode: 'L_SET',
    enabled: true,
    sortOrder: 4,
  },

  // ── 쓰기 (WRITING) ──
  {
    code: 'W_SHORT_ANSWER',
    name: '쓰기 단답형',
    section: 'WRITING',
    bankTypeCode: 'W_SHORT_ANSWER',
    enabled: true,
    sortOrder: 5,
  },
  {
    code: 'W_ESSAY_MED',
    name: '쓰기 중급서술',
    section: 'WRITING',
    bankTypeCode: 'W_ESSAY_MED',
    enabled: true,
    sortOrder: 6,
  },
  {
    code: 'W_ESSAY_ADV',
    name: '쓰기 고급서술',
    section: 'WRITING',
    bankTypeCode: 'W_ESSAY_ADV',
    enabled: true,
    sortOrder: 7,
  },

  // ── 읽기 (READING) ──
  {
    code: 'R_MCQ_SINGLE',
    name: '읽기 단일선택',
    section: 'READING',
    bankTypeCode: 'R_MCQ_SINGLE',
    enabled: true,
    sortOrder: 8,
  },
  {
    code: 'R_MCQ_MULTI',
    name: '읽기 복수선택',
    section: 'READING',
    bankTypeCode: 'R_MCQ_MULTI',
    enabled: true,
    sortOrder: 9,
  },
  {
    code: 'R_DROPDOWN',
    name: '읽기 드롭다운',
    section: 'READING',
    bankTypeCode: 'R_DROPDOWN',
    enabled: true,
    sortOrder: 10,
  },
  {
    code: 'R_ORDERING',
    name: '읽기 순서배열',
    section: 'READING',
    bankTypeCode: 'R_ORDERING',
    enabled: true,
    sortOrder: 11,
  },
  {
    code: 'R_INSERT_POS',
    name: '읽기 삽입위치',
    section: 'READING',
    bankTypeCode: 'R_INSERT_POS',
    enabled: true,
    sortOrder: 12,
  },
  {
    code: 'R_BLANK_FILL',
    name: '읽기 빈칸채우기',
    section: 'READING',
    bankTypeCode: 'R_BLANK_FILL',
    enabled: true,
    sortOrder: 13,
  },
  {
    code: 'R_MAIN_IDEA',
    name: '읽기 중심내용',
    section: 'READING',
    bankTypeCode: 'R_MAIN_IDEA',
    enabled: true,
    sortOrder: 14,
  },
  {
    code: 'R_MATCH_INFO',
    name: '읽기 정보연결',
    section: 'READING',
    bankTypeCode: 'R_MATCH_INFO',
    enabled: true,
    sortOrder: 15,
  },
];
