import React, { useEffect, useState } from 'react';
import type { QuestionBankDetail } from '../api/questionBankApi';
import { fetchQuestionDetail } from '../api/questionBankMock';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-[600px] max-h-[80vh] overflow-auto p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 bg-transparent border-none text-[22px] cursor-pointer"
        >
          ✕
        </button>

        <h3 className="m-0 mb-4">문제 미리보기</h3>

        {loading ? (
          <p className="text-gray-400">불러오는 중...</p>
        ) : detail ? (
          <>
            <div className="flex gap-2 mb-3">
              <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                {detail.typeName}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  detail.difficulty === 'HARD' && 'bg-red-50 text-red-700',
                  detail.difficulty === 'MEDIUM' && 'bg-yellow-50 text-amber-600',
                  detail.difficulty === 'EASY' && 'bg-green-50 text-green-700'
                )}
              >
                난이도: {DIFFICULTY_LABEL[detail.difficulty]}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 font-semibold">
              {detail.instruction}
            </div>

            {detail.passage && (
              <div className="p-4 border border-gray-300 rounded-lg mb-4 leading-relaxed">
                {detail.passage}
              </div>
            )}

            {detail.options.length > 0 && (
              <div className="mb-4">
                {detail.options.map((opt) => (
                  <div
                    key={opt.label}
                    className={cn(
                      'px-3 py-2 rounded-md mb-1.5',
                      showAnswer && opt.label === detail.correctAnswer
                        ? 'bg-green-50 border-2 border-green-700'
                        : 'bg-gray-50 border border-gray-300'
                    )}
                  >
                    <strong>{opt.label}</strong> {opt.text}
                  </div>
                ))}
              </div>
            )}

            <Button
              variant={showAnswer ? 'default' : 'outline'}
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? '정답 숨기기' : '정답 보기'}
            </Button>

            {showAnswer && detail.explanation && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm leading-relaxed">
                <strong>해설:</strong> {detail.explanation}
              </div>
            )}

            <div className="mt-4 text-xs text-gray-400">
              태그: {detail.tags.join(', ')} | 등록일:{' '}
              {new Date(detail.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </>
        ) : (
          <p className="text-red-600">문제를 불러올 수 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionPreview;
