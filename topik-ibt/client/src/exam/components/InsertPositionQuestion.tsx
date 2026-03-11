import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface InsertPositionQuestionProps {
  question: Question;
  answer: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
}

export default function InsertPositionQuestion({ question, answer, onAnswer }: InsertPositionQuestionProps) {
  const selectedPosition = answer?.insertPosition;

  // 지문을 [INSERT] 마커로 분할하여 삽입 가능 위치를 표시
  const parts = (question.passageText ?? '').split('[INSERT]');
  const insertCount = parts.length - 1;

  const handleSelect = (position: number) => {
    onAnswer({ insertPosition: position });
  };

  const circleLabels = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'];

  return (
    <div style={{ padding: '0 0 16px 0' }}>
      <div style={{
        fontSize: 16,
        lineHeight: '1.7',
        color: '#212121',
        marginBottom: 16,
        whiteSpace: 'pre-wrap',
      }}>
        {question.instruction}
      </div>

      {question.sentenceToInsert && (
        <div style={{
          backgroundColor: '#FFF3E0',
          border: '2px solid #FF9800',
          borderRadius: 8,
          padding: '14px 20px',
          marginBottom: 16,
          fontSize: 15,
          lineHeight: '1.7',
          color: '#E65100',
          fontWeight: 500,
        }}>
          삽입할 문장: {question.sentenceToInsert}
        </div>
      )}

      <div style={{
        backgroundColor: '#FAFAFA',
        border: '1px solid #E0E0E0',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 16,
        fontSize: 15,
        lineHeight: '2.2',
        color: '#333',
      }}>
        {parts.map((part, idx) => (
          <span key={idx}>
            <span style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
            {idx < insertCount && (
              <button
                onClick={() => handleSelect(idx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: selectedPosition === idx
                    ? '2px solid #1565C0'
                    : '2px solid #BDBDBD',
                  backgroundColor: selectedPosition === idx
                    ? '#1565C0'
                    : '#fff',
                  color: selectedPosition === idx
                    ? '#fff'
                    : '#757575',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  margin: '0 4px',
                  verticalAlign: 'middle',
                  transition: 'all 0.15s',
                }}
              >
                {circleLabels[idx] || idx + 1}
              </button>
            )}
          </span>
        ))}
      </div>

      <div style={{
        fontSize: 13,
        color: '#757575',
        marginTop: 8,
      }}>
        위 글에서 문장이 들어갈 가장 알맞은 곳을 선택하세요
      </div>
    </div>
  );
}
