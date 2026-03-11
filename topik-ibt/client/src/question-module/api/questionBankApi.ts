// ─── 문제 은행 API 인터페이스 ────────────────────────────────

export interface QuestionBankQuery {
  typeCode: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  keyword?: string;
  page?: number;
  size?: number;
}

export interface QuestionBankItem {
  bankId: string;
  typeCode: string;
  typeName: string;
  section: 'LISTENING' | 'WRITING' | 'READING';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  previewText: string;
  hasAudio: boolean;
  hasImage: boolean;
  usageCount: number;
  tags: string[];
  createdAt: string;
}

export interface QuestionBankDetail {
  bankId: string;
  typeCode: string;
  typeName: string;
  section: 'LISTENING' | 'WRITING' | 'READING';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  instruction: string;
  passage: string;
  audioUrl?: string;
  imageUrl?: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  modelAnswer?: string;
  scoringCriteria?: string;
  tags: string[];
  createdAt: string;
}

export interface QuestionBankResponse {
  items: QuestionBankItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
