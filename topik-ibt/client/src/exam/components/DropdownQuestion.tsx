import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface DropdownQuestionProps {
  question: Question;
  answer: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
}

const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥'];

function DropdownSelect({
  options,
  selectedId,
  onSelect,
}: {
  options: { id: number; text: string }[];
  selectedId: number | undefined;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOpt = options.find((o) => o.id === selectedId);

  return (
    <span className="relative inline-block">
      <button
        className="min-w-[80px] rounded-md border-2 border-blue-800 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {selectedOpt
          ? `${circleNumbers[options.indexOf(selectedOpt)] ?? ''} ${selectedOpt.text}`
          : '[ 선택 ]'}
        {' ▾'}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1 min-w-[160px] rounded-md border border-gray-300 bg-white shadow-lg">
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className={cn(
                'cursor-pointer border-b border-gray-100 px-4 py-2.5 text-sm transition-colors hover:bg-gray-100',
                opt.id === selectedId && 'bg-blue-50'
              )}
              onClick={() => {
                onSelect(opt.id);
                setOpen(false);
              }}
            >
              {circleNumbers[idx]} {opt.text}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

export default function DropdownQuestion({
  question,
  answer,
  onAnswer,
}: DropdownQuestionProps) {
  const selectedDropdown = answer?.selectedDropdown;
  const passageText = question.passageText ?? '';
  const options = question.options ?? [];

  // Split passage on [BLANK] markers
  const parts = passageText.split('[BLANK]');

  const handleSelect = (optionId: number) => {
    onAnswer({ selectedDropdown: optionId });
  };

  return (
    <div className="pb-4">
      <div className="mb-4 whitespace-pre-wrap text-base leading-[1.7] text-gray-900">
        {question.instruction}
      </div>

      <div className="mb-4 whitespace-pre-wrap rounded-lg border border-gray-300 bg-gray-50 px-5 py-4 text-[15px] leading-[2.2] text-gray-700">
        {parts.map((part, idx) => (
          <span key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <DropdownSelect
                options={options}
                selectedId={selectedDropdown}
                onSelect={handleSelect}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
