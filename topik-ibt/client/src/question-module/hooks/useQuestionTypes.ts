import { useMemo } from 'react';
import {
  DEFAULT_QUESTION_TYPES,
  QuestionTypeConfig,
} from '../config/questionTypes.config';

export function useQuestionTypes(section?: 'LISTENING' | 'WRITING' | 'READING') {
  const types = useMemo<QuestionTypeConfig[]>(() => {
    let filtered = DEFAULT_QUESTION_TYPES.filter((t) => t.enabled);
    if (section) {
      filtered = filtered.filter((t) => t.section === section);
    }
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [section]);

  return types;
}
