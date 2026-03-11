// ─── 공통 타입 정의 (client + server 공유) ─────────────────────

// 영역 타입
export type SectionType = 'LISTENING' | 'WRITING' | 'READING';

// 시험 유형
export type ExamType = 'TOPIK_I' | 'TOPIK_II';

// ─── 응시자 ───────────────────────────────────────────────────
export type ExamineeStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface Examinee {
  id: string;
  loginId: string;
  name: string;
  registrationNumber: string;
  seatNumber: number | null;
  photoUrl: string | null;
  institutionName: string | null;
  examRoomName: string | null;
  status: ExamineeStatus;
  assignedExamSetId: string | null;
}

// ─── 시험세트 ─────────────────────────────────────────────────
export type ExamSetStatus = 'DRAFT' | 'UPLOADED' | 'ACTIVE' | 'ARCHIVED';

export interface ExamSetSection {
  bankIds: string[];
  durationMinutes: number;
}

export interface ExamSet {
  id: string;
  examSetNumber: string;
  name: string;
  examType: ExamType;
  description: string | null;
  status: ExamSetStatus;
  sections: Record<SectionType, ExamSetSection>;
  scheduledStartAt: string | null;
  uploadedAt: string | null;
  assignedCount?: number;
}

// ─── 문항 ─────────────────────────────────────────────────────
export type QuestionType =
  | 'MCQ_SINGLE'
  | 'MCQ_MULTI'
  | 'DROPDOWN'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'ORDERING'
  | 'INSERT_POSITION';

export interface Question {
  questionId: string;
  section: SectionType;
  questionType: QuestionType;
  questionNumber: number;
  instruction: string;
  passageText?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioMaxPlay?: number;
  options?: { id: number; text: string; imageUrl?: string }[];
  maxSelect?: number;
  sentenceCards?: { id: string; text: string }[];
  sentenceToInsert?: string;
  characterLimit?: { min: number; max: number };
  gapLabels?: string[];
}

// ─── 답안 ─────────────────────────────────────────────────────
export interface AnswerValue {
  selectedOptions?: number[];
  textInput?: string;
  gapAnswers?: Record<string, string>;
  orderedItems?: string[];
  insertPosition?: number;
  selectedDropdown?: number;
}

export interface Answer {
  answerId: string;
  sessionId: string;
  questionBankId: string;
  section: SectionType;
  questionIndex: number;
  answerJson: AnswerValue;
  savedAt: string;
  submittedAt: string | null;
  isAutoSubmitted: boolean;
}

// ─── 응시 세션 ────────────────────────────────────────────────
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface SectionProgress {
  startedAt: string | null;
  submittedAt: string | null;
  isAutoSubmitted: boolean;
}

export interface ExamSession {
  sessionId: string;
  examineeId: string;
  examSetId: string;
  status: SessionStatus;
  sectionProgress: Record<SectionType, SectionProgress>;
  startedAt: string;
  completedAt: string | null;
}

// ─── 어드민 ───────────────────────────────────────────────────
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'PROCTOR' | 'QUESTION_AUTHOR';

export interface AdminUser {
  id: string;
  loginId: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
}

// ─── API 응답 ─────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
