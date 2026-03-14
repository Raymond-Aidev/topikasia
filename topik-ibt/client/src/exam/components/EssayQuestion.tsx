import { useState, useEffect, useRef, useCallback } from 'react';
import { useKoreanCharCount } from '../hooks/useKoreanCharCount';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../lib/utils';

interface EssayQuestionProps {
  question: Question;
  answer: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
}

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
    if (displayCount < charLimit.min * 0.8) return 'text-red-500';
    if (displayCount < charLimit.min) return 'text-orange-500';
    if (displayCount <= charLimit.max) return 'text-green-500';
    if (displayCount <= charLimit.max * 1.1) return 'text-orange-500';
    return 'text-red-500';
  };

  const getBarColor = (): string => {
    if (displayCount < charLimit.min * 0.8) return 'bg-red-500';
    if (displayCount < charLimit.min) return 'bg-orange-500';
    if (displayCount <= charLimit.max) return 'bg-green-500';
    if (displayCount <= charLimit.max * 1.1) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Progress bar fill percentage (capped at 100% visually)
  const progressPercent = Math.min((displayCount / charLimit.max) * 100, 100);

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

      <Textarea
        ref={textareaRef}
        className="min-h-[300px] w-full resize-y border-2 border-gray-300 px-[18px] py-4 font-inherit text-[15px] leading-[1.8] transition-colors focus-visible:border-blue-800"
        value={text}
        onChange={handleChange}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        placeholder="여기에 작성하세요..."
      />

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-300">
        <div
          className={cn('h-full rounded-full transition-all duration-300', getBarColor())}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className={cn('mt-2 text-right text-sm font-semibold', getCounterColor())}>
        {displayCount} / {charLimit.max}자
        {displayCount < charLimit.min && (
          <span className={cn('ml-2 text-xs', getCounterColor())}>
            (최소 {charLimit.min}자)
          </span>
        )}
      </div>
    </div>
  );
}
