import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-auto" showCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold text-gray-900">전체 문제</DialogTitle>
            <span className="text-[13px] text-gray-500">({countdown}초 후 자동 닫힘)</span>
          </div>
        </DialogHeader>

        <div className="mb-4 flex gap-2">
          <Button
            variant={tab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('all')}
          >
            전체문제 ({questions.length})
          </Button>
          <Button
            variant={tab === 'unanswered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('unanswered')}
          >
            안 푼 문제 ({unansweredCount})
          </Button>
        </div>

        <div className="mb-5 grid grid-cols-10 gap-1.5">
          {filteredQuestions.map((q) => {
            const originalIdx = questions.findIndex((qq) => qq.questionId === q.questionId);
            const answered = isAnswered(answers[q.questionId]);
            const isCurrent = originalIdx === currentIndex;

            return (
              <div
                key={q.questionId}
                className={cn(
                  'flex aspect-square cursor-pointer items-center justify-center rounded-md text-[13px] font-semibold transition-all',
                  answered ? 'bg-white' : 'bg-red-200',
                  isCurrent
                    ? 'border-2 border-blue-800 shadow-[0_0_0_1px_#1565C0]'
                    : 'border-2 border-transparent'
                )}
                onClick={() => handleCellClick(q)}
                title={`${q.questionNumber}번 ${answered ? '(답안 작성됨)' : '(미응답)'}`}
              >
                {q.questionNumber}
              </div>
            );
          })}
        </div>

        <Button
          className="w-full py-3.5 text-base font-bold"
          onClick={onSubmit}
        >
          답안 제출 →
        </Button>
      </DialogContent>
    </Dialog>
  );
}
