import { useState, useEffect, useRef, useCallback } from 'react';
import type { Question } from '../../types/exam.types';
import type { AnswerValue } from '../../store/examStore';

interface AllQuestionsPopupProps {
  questions: Question[];
  answers: Record<string, AnswerValue>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '24px 28px',
    width: '90%',
    maxWidth: 560,
    maxHeight: '80vh',
    overflow: 'auto' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: '#212121',
  },
  countdown: {
    fontSize: 13,
    color: '#757575',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: '#757575',
    padding: '0 4px',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600 as const,
    border: '1px solid #E0E0E0',
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: '#fff',
    color: '#757575',
    transition: 'all 0.15s',
  },
  tabActive: {
    backgroundColor: '#1565C0',
    color: '#fff',
    borderColor: '#1565C0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: 6,
    marginBottom: 20,
  },
  cell: {
    width: '100%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600 as const,
    borderRadius: 6,
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.15s',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 700 as const,
    backgroundColor: '#1565C0',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};

function isAnswered(answer: AnswerValue | undefined): boolean {
  if (!answer) return false;
  if (answer.selectedOptions && answer.selectedOptions.length > 0) return true;
  if (answer.textInput && answer.textInput.trim().length > 0) return true;
  if (answer.gapAnswers && Object.values(answer.gapAnswers).some((v) => v.trim().length > 0)) return true;
  if (answer.selectedDropdown !== undefined) return true;
  if (answer.orderedItems && answer.orderedItems.length > 0) return true;
  if (answer.insertPosition !== undefined) return true;
  return false;
}

export default function AllQuestionsPopup({
  questions,
  answers,
  currentIndex,
  onNavigate,
  onClose,
  onSubmit,
}: AllQuestionsPopupProps) {
  const [tab, setTab] = useState<'all' | 'unanswered'>('all');
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-close countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onClose]);

  const filteredQuestions = tab === 'all'
    ? questions
    : questions.filter((q) => !isAnswered(answers[q.questionId]));

  const unansweredCount = questions.filter((q) => !isAnswered(answers[q.questionId])).length;

  const handleCellClick = useCallback(
    (q: Question) => {
      const idx = questions.findIndex((qq) => qq.questionId === q.questionId);
      if (idx >= 0) {
        onNavigate(idx);
        onClose();
      }
    },
    [questions, onNavigate, onClose],
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <span style={styles.title}>전체 문제</span>
            <span style={styles.countdown}> ({countdown}초 후 자동 닫힘)</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'all' ? styles.tabActive : {}) }}
            onClick={() => setTab('all')}
          >
            전체문제 ({questions.length})
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'unanswered' ? styles.tabActive : {}) }}
            onClick={() => setTab('unanswered')}
          >
            안 푼 문제 ({unansweredCount})
          </button>
        </div>

        <div style={styles.grid}>
          {filteredQuestions.map((q) => {
            const originalIdx = questions.findIndex((qq) => qq.questionId === q.questionId);
            const answered = isAnswered(answers[q.questionId]);
            const isCurrent = originalIdx === currentIndex;

            return (
              <div
                key={q.questionId}
                style={{
                  ...styles.cell,
                  backgroundColor: answered ? '#fff' : '#FFCDD2',
                  borderColor: isCurrent ? '#1565C0' : 'transparent',
                  boxShadow: isCurrent ? '0 0 0 1px #1565C0' : 'none',
                }}
                onClick={() => handleCellClick(q)}
                title={`${q.questionNumber}번 ${answered ? '(답안 작성됨)' : '(미응답)'}`}
              >
                {q.questionNumber}
              </div>
            );
          })}
        </div>

        <button style={styles.submitBtn} onClick={onSubmit}>
          답안 제출 →
        </button>
      </div>
    </div>
  );
}
