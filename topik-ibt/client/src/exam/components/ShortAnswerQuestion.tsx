import { useState, useEffect, useRef } from 'react';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';
import { Input } from '../../components/ui/input';

interface ShortAnswerQuestionProps {
  question: Question;
  answer: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
}

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
    <div className="pb-4">
      <div className="mb-4 whitespace-pre-wrap text-base leading-[1.7] text-gray-900">
        {question.instruction}
      </div>

      {question.passageText && (
        <div className="mb-5 whitespace-pre-wrap rounded-lg border border-gray-300 bg-gray-100 px-6 py-5 text-[15px] leading-[1.8] text-gray-700">
          {question.passageText}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {gapLabels.map((label) => (
          <div key={label} className="flex items-center gap-3">
            <span className="min-w-7 text-lg font-bold text-blue-800">
              {label}
            </span>
            <Input
              type="text"
              value={values[label] ?? ''}
              onChange={(e) => handleChange(label, e.target.value)}
              placeholder={`${label} 답을 입력하세요`}
              className="flex-1 border-2 border-gray-300 px-3.5 py-2.5 text-[15px] focus-visible:border-blue-800"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
