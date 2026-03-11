export type SectionType = 'LISTENING' | 'WRITING' | 'READING';
export type ExamType = 'TOPIK_I' | 'TOPIK_II';
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
  bankId: string;
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
