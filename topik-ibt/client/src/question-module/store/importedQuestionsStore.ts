import { create } from 'zustand';
import type { QuestionBankItem } from '../api/questionBankApi';

interface ImportedQuestionsState {
  selectedByType: Record<string, QuestionBankItem[]>;

  setSelected: (typeCode: string, items: QuestionBankItem[]) => void;
  clearAll: () => void;
  getAllSelected: () => QuestionBankItem[];
  getSelectedBySection: (section: 'LISTENING' | 'WRITING' | 'READING') => QuestionBankItem[];
}

export const useImportedQuestionsStore = create<ImportedQuestionsState>((set, get) => ({
  selectedByType: {},

  setSelected: (typeCode, items) =>
    set((state) => ({
      selectedByType: { ...state.selectedByType, [typeCode]: items },
    })),

  clearAll: () => set({ selectedByType: {} }),

  getAllSelected: () => {
    const map = get().selectedByType;
    return Object.values(map).flat();
  },

  getSelectedBySection: (section) => {
    const map = get().selectedByType;
    return Object.values(map)
      .flat()
      .filter((item) => item.section === section);
  },
}));
