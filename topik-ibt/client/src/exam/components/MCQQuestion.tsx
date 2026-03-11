import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface MCQQuestionProps {
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
  passage: {
    backgroundColor: '#FAFAFA',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 16,
    fontSize: 15,
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap' as const,
    color: '#333',
  },
  optionList: {
    listStyle: 'none' as const,
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 8,
    border: '2px solid #E0E0E0',
    cursor: 'pointer',
    fontSize: 15,
    lineHeight: '1.5',
    transition: 'all 0.15s',
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#E3F2FD',
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '2px solid #BDBDBD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 12,
    fontWeight: 700 as const,
    color: '#757575',
  },
  indicatorSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#1565C0',
    color: '#fff',
  },
  checkboxIndicator: {
    width: 22,
    height: 22,
    borderRadius: 4,
    border: '2px solid #BDBDBD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 700 as const,
    color: '#757575',
  },
};

const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

export default function MCQQuestion({ question, answer, onAnswer }: MCQQuestionProps) {
  const isMulti = question.questionType === 'MCQ_MULTI';
  const maxSelect = question.maxSelect ?? (isMulti ? 2 : 1);
  const selectedOptions = answer?.selectedOptions ?? [];

  const handleSelect = (optionId: number) => {
    if (isMulti) {
      let next: number[];
      if (selectedOptions.includes(optionId)) {
        next = selectedOptions.filter((id) => id !== optionId);
      } else {
        if (selectedOptions.length >= maxSelect) {
          // Toast-style alert
          alert(`최대 ${maxSelect}개까지 선택할 수 있습니다.`);
          return;
        }
        next = [...selectedOptions, optionId];
      }
      onAnswer({ selectedOptions: next });
    } else {
      onAnswer({ selectedOptions: [optionId] });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.instruction}>{question.instruction}</div>

      {question.passageText && (
        <div style={styles.passage}>{question.passageText}</div>
      )}

      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="문제 이미지"
          style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 16 }}
        />
      )}

      <ul style={styles.optionList}>
        {question.options?.map((opt, idx) => {
          const isSelected = selectedOptions.includes(opt.id);
          return (
            <li
              key={opt.id}
              style={{
                ...styles.option,
                ...(isSelected ? styles.optionSelected : {}),
              }}
              onClick={() => handleSelect(opt.id)}
            >
              {isMulti ? (
                <div
                  style={{
                    ...styles.checkboxIndicator,
                    ...(isSelected ? styles.indicatorSelected : {}),
                  }}
                >
                  {isSelected ? '✓' : ''}
                </div>
              ) : (
                <div
                  style={{
                    ...styles.indicator,
                    ...(isSelected ? styles.indicatorSelected : {}),
                  }}
                >
                  {circleNumbers[idx] || idx + 1}
                </div>
              )}
              <span>{opt.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
