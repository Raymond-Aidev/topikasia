import React, { useEffect, useState } from 'react';
import { QuestionBankDetail } from '../api/questionBankApi';
import { fetchQuestionDetail } from '../api/questionBankMock';

interface Props {
  bankId: string;
  onClose: () => void;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '하',
  MEDIUM: '중',
  HARD: '상',
};

const QuestionPreview: React.FC<Props> = ({ bankId, onClose }) => {
  const [detail, setDetail] = useState<QuestionBankDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchQuestionDetail(bankId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [bankId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: 600,
          maxHeight: '80vh',
          overflow: 'auto',
          padding: 28,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <h3 style={{ margin: '0 0 16px' }}>문제 미리보기</h3>

        {loading ? (
          <p style={{ color: '#888' }}>불러오는 중...</p>
        ) : detail ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 4,
                  fontSize: 13,
                  background: '#e8f0fe',
                  color: '#1a73e8',
                }}
              >
                {detail.typeName}
              </span>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 4,
                  fontSize: 13,
                  background:
                    detail.difficulty === 'HARD'
                      ? '#fce8e6'
                      : detail.difficulty === 'MEDIUM'
                        ? '#fef7e0'
                        : '#e6f4ea',
                  color:
                    detail.difficulty === 'HARD'
                      ? '#c5221f'
                      : detail.difficulty === 'MEDIUM'
                        ? '#e37400'
                        : '#137333',
                }}
              >
                난이도: {DIFFICULTY_LABEL[detail.difficulty]}
              </span>
            </div>

            <div
              style={{
                background: '#f8f9fa',
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              {detail.instruction}
            </div>

            {detail.passage && (
              <div
                style={{
                  padding: 16,
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  marginBottom: 16,
                  lineHeight: 1.7,
                }}
              >
                {detail.passage}
              </div>
            )}

            {detail.options.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {detail.options.map((opt) => (
                  <div
                    key={opt.label}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      marginBottom: 6,
                      background:
                        showAnswer && opt.label === detail.correctAnswer
                          ? '#e6f4ea'
                          : '#fafafa',
                      border:
                        showAnswer && opt.label === detail.correctAnswer
                          ? '2px solid #137333'
                          : '1px solid #e0e0e0',
                    }}
                  >
                    <strong>{opt.label}</strong> {opt.text}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAnswer(!showAnswer)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #1a73e8',
                background: showAnswer ? '#1a73e8' : '#fff',
                color: showAnswer ? '#fff' : '#1a73e8',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {showAnswer ? '정답 숨기기' : '정답 보기'}
            </button>

            {showAnswer && detail.explanation && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#fffde7',
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                <strong>해설:</strong> {detail.explanation}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
              태그: {detail.tags.join(', ')} | 등록일:{' '}
              {new Date(detail.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </>
        ) : (
          <p style={{ color: '#d93025' }}>문제를 불러올 수 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionPreview;
