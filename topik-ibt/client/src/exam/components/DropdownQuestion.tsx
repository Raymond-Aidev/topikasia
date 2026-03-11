import { useState } from 'react';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface DropdownQuestionProps {
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
    lineHeight: '2.2',
    whiteSpace: 'pre-wrap' as const,
    color: '#333',
  },
  dropdown: {
    display: 'inline-block',
    position: 'relative' as const,
  },
  dropdownButton: {
    padding: '4px 12px',
    fontSize: 14,
    border: '2px solid #1565C0',
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
    cursor: 'pointer',
    minWidth: 80,
    fontWeight: 600 as const,
  },
  dropdownMenu: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: 160,
    marginTop: 4,
  },
  dropdownItem: {
    padding: '10px 16px',
    fontSize: 14,
    cursor: 'pointer',
    borderBottom: '1px solid #F5F5F5',
    transition: 'background-color 0.1s',
  },
};

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
    <span style={styles.dropdown}>
      <button
        style={styles.dropdownButton}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {selectedOpt
          ? `${circleNumbers[options.indexOf(selectedOpt)] ?? ''} ${selectedOpt.text}`
          : '[ 선택 ]'}
        {' ▾'}
      </button>
      {open && (
        <div style={styles.dropdownMenu}>
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              style={{
                ...styles.dropdownItem,
                backgroundColor: opt.id === selectedId ? '#E3F2FD' : '#fff',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLDivElement).style.backgroundColor = '#F5F5F5';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLDivElement).style.backgroundColor =
                  opt.id === selectedId ? '#E3F2FD' : '#fff';
              }}
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
    <div style={styles.container}>
      <div style={styles.instruction}>{question.instruction}</div>

      <div style={styles.passage}>
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
