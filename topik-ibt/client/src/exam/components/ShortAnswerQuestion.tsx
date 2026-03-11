import { useState, useEffect, useRef } from 'react';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface ShortAnswerQuestionProps {
  question: Question;
  answer: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
}

const styles = {
  container: {
    padding: '0 0 16px 0',
  },
  instruction: {
    fontSize: 16,
    lineHeight: '1.7',
    color: '#212121',
    marginBottom: 16,
    whiteSpace: 'pre-wrap' as const,
  },
  passageBox: {
    backgroundColor: '#F5F5F5',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    padding: '20px 24px',
    marginBottom: 20,
    fontSize: 15,
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap' as const,
    color: '#333',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: '#1565C0',
    minWidth: 28,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: 15,
    border: '2px solid #E0E0E0',
    borderRadius: 6,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
};

const DEBOUNCE_MS = 1000;

export default function ShortAnswerQuestion({
  question,
  answer,
  onAnswer,
}: ShortAnswerQuestionProps) {
  const gapLabels = question.gapLabels ?? ['ㄱ', 'ㄴ'];
  const existingGaps = answer?.gapAnswers ?? {};

  const [values, setValues] = useState<Record<string, string>>(existingGaps);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from prop when question changes
  useEffect(() => {
    setValues(answer?.gapAnswers ?? {});
  }, [question.questionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (label: string, text: string) => {
    const next = { ...values, [label]: text };
    setValues(next);

    // Debounced save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onAnswer({ gapAnswers: next });
    }, DEBOUNCE_MS);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.instruction}>{question.instruction}</div>

      {question.passageText && (
        <div style={styles.passageBox}>{question.passageText}</div>
      )}

      <div style={styles.fieldGroup}>
        {gapLabels.map((label) => (
          <div key={label} style={styles.fieldRow}>
            <span style={styles.label}>{label}</span>
            <input
              style={styles.input}
              type="text"
              value={values[label] ?? ''}
              onChange={(e) => handleChange(label, e.target.value)}
              placeholder={`${label} 답을 입력하세요`}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#1565C0';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#E0E0E0';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
