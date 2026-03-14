import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
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
    <div className="pb-4">
      <div className="mb-4 whitespace-pre-wrap text-base leading-[1.7] text-gray-900">
        {question.instruction}
      </div>

      {question.sentenceToInsert && (
        <div className="mb-4 rounded-lg border-2 border-orange-500 bg-orange-50 px-5 py-3.5 text-[15px] font-medium leading-[1.7] text-orange-900">
          삽입할 문장: {question.sentenceToInsert}
        </div>
      )}

      <div className="mb-4 rounded-lg border border-gray-300 bg-gray-50 px-6 py-5 text-[15px] leading-[2.2] text-gray-700">
        {parts.map((part, idx) => (
          <span key={idx}>
            <span className="whitespace-pre-wrap">{part}</span>
            {idx < insertCount && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSelect(idx)}
                className={cn(
                  'mx-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold align-middle transition-all',
                  selectedPosition === idx
                    ? 'border-2 border-blue-800 bg-blue-800 text-white hover:bg-blue-800'
                    : 'border-2 border-gray-400 bg-white text-gray-500 hover:bg-gray-100'
                )}
              >
                {circleLabels[idx] || idx + 1}
              </Button>
            )}
          </span>
        ))}
      </div>

      <div className="mt-2 text-[13px] text-gray-500">
        위 글에서 문장이 들어갈 가장 알맞은 곳을 선택하세요
      </div>
    </div>
  );
}
