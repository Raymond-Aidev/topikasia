export interface QuestionTypeConfig {
  code: string;
  name: string;
  section: string;
  isActive: boolean;
}

export const defaultQuestionTypes: QuestionTypeConfig[] = [
  // 듣기 (LISTENING)
  { code: 'MCQ_SINGLE', name: '객관식 단일 선택', section: 'LISTENING', isActive: true },
  { code: 'MCQ_MULTI', name: '객관식 복수 선택', section: 'LISTENING', isActive: true },
  { code: 'DROPDOWN', name: '드롭다운 선택', section: 'LISTENING', isActive: true },
  { code: 'ORDERING', name: '순서 배열', section: 'LISTENING', isActive: true },
  { code: 'INSERT_POSITION', name: '삽입 위치 찾기', section: 'LISTENING', isActive: true },

  // 쓰기 (WRITING)
  { code: 'SHORT_ANSWER', name: '단답형', section: 'WRITING', isActive: true },
  { code: 'ESSAY', name: '서술형 (작문)', section: 'WRITING', isActive: true },
  { code: 'FILL_IN_BLANK', name: '빈칸 채우기', section: 'WRITING', isActive: true },
  { code: 'SENTENCE_COMPLETION', name: '문장 완성', section: 'WRITING', isActive: true },
  { code: 'SUMMARY', name: '요약하기', section: 'WRITING', isActive: true },

  // 읽기 (READING)
  { code: 'MCQ_SINGLE_READING', name: '객관식 단일 선택 (읽기)', section: 'READING', isActive: true },
  { code: 'MCQ_MULTI_READING', name: '객관식 복수 선택 (읽기)', section: 'READING', isActive: true },
  { code: 'MATCHING', name: '짝 맞추기', section: 'READING', isActive: true },
  { code: 'TRUE_FALSE', name: '참/거짓 판별', section: 'READING', isActive: true },
  { code: 'INSERT_POSITION_READING', name: '삽입 위치 찾기 (읽기)', section: 'READING', isActive: true },
];
