import { create } from 'zustand';
import type { SectionType, ExamType } from '../types/exam.types';

export interface ExamineeInfo {
  id: string;
  loginId: string;
  name: string;
  registrationNumber: string;
  seatNumber: number | null;
  photoUrl: string | null;
  institutionName: string | null;
  examRoomName: string | null;
}

export interface AssignedExamSet {
  examSetId: string;
  examSetNumber: string;
  name: string;
  examType: ExamType;
  sections: { section: SectionType; questionCount: number; durationMinutes: number }[];
  totalDurationMinutes: number;
  scheduledStartAt: string | null;
}

export interface AnswerValue {
  selectedOptions?: number[];
  textInput?: string;
  gapAnswers?: Record<string, string>;
  orderedItems?: string[];
  insertPosition?: number;
  selectedDropdown?: number;
}

interface ExamState {
  // 응시자 정보
  examinee: ExamineeInfo | null;
  assignedExamSet: AssignedExamSet | null;

  // 세션 상태
  sessionId: string | null;
  currentSection: SectionType | null;
  examPhase: 'LOGIN' | 'VERIFY' | 'SELECT_SET' | 'WAITING' | 'IN_PROGRESS' | 'SUBMITTING' | 'DONE';

  // 타이머
  sectionRemainingSeconds: number;
  sectionStartedAt: string | null;

  // 답안
  answers: Record<string, AnswerValue>;

  // 네트워크
  hasNetworkError: boolean;

  // 동시시작
  scheduledStartAt: string | null;
  countdownSeconds: number | null;
  isExamBlocked: boolean;

  // 액션
  setExaminee: (e: ExamineeInfo | null) => void;
  setAssignedExamSet: (s: AssignedExamSet | null) => void;
  setSession: (sessionId: string | null) => void;
  setCurrentSection: (section: SectionType | null) => void;
  setExamPhase: (phase: ExamState['examPhase']) => void;
  setSectionRemainingSeconds: (s: number) => void;
  setSectionStartedAt: (t: string | null) => void;
  setAnswer: (questionId: string, value: AnswerValue) => void;
  setAnswers: (answers: Record<string, AnswerValue>) => void;
  setNetworkError: (v: boolean) => void;
  setScheduledStartAt: (t: string | null) => void;
  setCountdownSeconds: (s: number | null) => void;
  setExamBlocked: (v: boolean) => void;
  clearSession: () => void;
  reset: () => void;
}

const initialState = {
  examinee: null,
  assignedExamSet: null,
  sessionId: null,
  currentSection: null,
  examPhase: 'LOGIN' as const,
  sectionRemainingSeconds: 0,
  sectionStartedAt: null,
  answers: {},
  hasNetworkError: false,
  scheduledStartAt: null,
  countdownSeconds: null,
  isExamBlocked: false,
};

export const useExamStore = create<ExamState>((set) => ({
  ...initialState,

  setExaminee: (e) => set({ examinee: e }),
  setAssignedExamSet: (s) => set({ assignedExamSet: s, scheduledStartAt: s?.scheduledStartAt ?? null }),
  setSession: (sessionId) => set({ sessionId }),
  setCurrentSection: (section) => set({ currentSection: section }),
  setExamPhase: (phase) => set({ examPhase: phase }),
  setSectionRemainingSeconds: (s) => set({ sectionRemainingSeconds: s }),
  setSectionStartedAt: (t) => set({ sectionStartedAt: t }),
  setAnswer: (questionId, value) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: value } })),
  setAnswers: (answers) => set({ answers }),
  setNetworkError: (v) => set({ hasNetworkError: v }),
  setScheduledStartAt: (t) => set({ scheduledStartAt: t }),
  setCountdownSeconds: (s) => set({ countdownSeconds: s }),
  setExamBlocked: (v) => set({ isExamBlocked: v }),
  clearSession: () => set({ sessionId: null, currentSection: null, answers: {}, sectionRemainingSeconds: 0 }),
  reset: () => set(initialState),
}));
