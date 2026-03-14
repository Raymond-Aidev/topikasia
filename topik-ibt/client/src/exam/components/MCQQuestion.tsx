import { cn } from '../../lib/utils';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface MCQQuestionProps {
  question: Question;
  answer: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
}

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
    <div className="pb-4">
      <div className="mb-4 whitespace-pre-wrap text-base leading-[1.7] text-gray-900">
        {question.instruction}
      </div>

      {question.passageText && (
        <div className="mb-4 whitespace-pre-wrap rounded-lg border border-gray-300 bg-gray-50 px-5 py-4 text-[15px] leading-[1.8] text-gray-700">
          {question.passageText}
        </div>
      )}

      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="문제 이미지"
          className="mb-4 max-w-full rounded-lg"
        />
      )}

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {question.options?.map((opt, idx) => {
          const isSelected = selectedOptions.includes(opt.id);
          return (
            <li
              key={opt.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border-2 bg-white px-4 py-3 text-[15px] leading-normal transition-all',
                isSelected
                  ? 'border-blue-800 bg-blue-50'
                  : 'border-gray-300'
              )}
              onClick={() => handleSelect(opt.id)}
            >
              {isMulti ? (
                <div
                  className={cn(
                    'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded text-sm font-bold',
                    isSelected
                      ? 'border-2 border-blue-800 bg-blue-800 text-white'
                      : 'border-2 border-gray-400 text-gray-500'
                  )}
                >
                  {isSelected ? '✓' : ''}
                </div>
              ) : (
                <div
                  className={cn(
                    'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isSelected
                      ? 'border-2 border-blue-800 bg-blue-800 text-white'
                      : 'border-2 border-gray-400 text-gray-500'
                  )}
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
