import { useState, useEffect, useRef, useCallback } from 'react';
import { useKoreanCharCount } from '../hooks/useKoreanCharCount';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface EssayQuestionProps {
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
  textarea: {
    width: '100%',
    minHeight: 300,
    padding: '16px 18px',
    fontSize: 15,
    lineHeight: '1.8',
    border: '2px solid #E0E0E0',
    borderRadius: 8,
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  counter: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 600 as const,
    textAlign: 'right' as const,
  },
};

const DEBOUNCE_MS = 1000;

export default function EssayQuestion({
  question,
  answer,
  onAnswer,
}: EssayQuestionProps) {
  const charLimit = question.characterLimit ?? { min: 200, max: 500 };
  const [text, setText] = useState(answer?.textInput ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    displayCount,
    onCompositionStart,
    onCompositionEnd,
    updateCount,
  } = useKoreanCharCount();

  // Sync from prop on question change
  useEffect(() => {
    const t = answer?.textInput ?? '';
    setText(t);
    updateCount(t);
  }, [question.questionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(300, el.scrollHeight) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    updateCount(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onAnswer({ textInput: val });
    }, DEBOUNCE_MS);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Color coding for character count with warning zones
  const getCounterColor = (): string => {
    if (displayCount < charLimit.min * 0.8) return '#F44336'; // red: well below min
    if (displayCount < charLimit.min) return '#FF9800'; // orange: approaching minimum
    if (displayCount <= charLimit.max) return '#4CAF50'; // green: in range
    if (displayCount <= charLimit.max * 1.1) return '#FF9800'; // orange: approaching maximum
    return '#F44336'; // red: well above max
  };

  // Progress bar fill percentage (capped at 100% visually)
  const progressPercent = Math.min((displayCount / charLimit.max) * 100, 100);
  const progressColor = getCounterColor();

  return (
    <div style={styles.container}>
      <div style={styles.instruction}>{question.instruction}</div>

      {question.passageText && (
        <div style={styles.passageBox}>{question.passageText}</div>
      )}

      <textarea
        ref={textareaRef}
        style={{
          ...styles.textarea,
        }}
        value={text}
        onChange={handleChange}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onFocus={(e) => {
          (e.target as HTMLTextAreaElement).style.borderColor = '#1565C0';
        }}
        onBlur={(e) => {
          (e.target as HTMLTextAreaElement).style.borderColor = '#E0E0E0';
        }}
        placeholder="여기에 작성하세요..."
      />

      {/* Progress bar */}
      <div style={{ width: '100%', height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          backgroundColor: progressColor,
          borderRadius: 3,
          transition: 'width 0.3s ease, background-color 0.3s ease',
        }} />
      </div>

      <div style={{ ...styles.counter, color: getCounterColor() }}>
        {displayCount} / {charLimit.max}자
        {displayCount < charLimit.min && (
          <span style={{ marginLeft: 8, fontSize: 12, color: getCounterColor() }}>
            (최소 {charLimit.min}자)
          </span>
        )}
      </div>
    </div>
  );
}
