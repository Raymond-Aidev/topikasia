import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface ExamHeaderProps {
  registrationNumber?: string;
  examTitle?: string;
  timerMode: 'countdown' | 'clock';
  remainingSeconds?: number;
  onTimerExpire?: () => void;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function ExamHeader({ registrationNumber, examTitle, timerMode, remainingSeconds = 0, onTimerExpire }: ExamHeaderProps) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    if (timerMode === 'clock') {
      const id = setInterval(() => setClock(new Date()), 1000);
      return () => clearInterval(id);
    }
  }, [timerMode]);

  useEffect(() => {
    if (timerMode === 'countdown' && remainingSeconds <= 0 && onTimerExpire) {
      onTimerExpire();
    }
  }, [timerMode, remainingSeconds, onTimerExpire]);

  const isWarning = timerMode === 'countdown' && remainingSeconds <= 300;
  const timerLabel = timerMode === 'countdown' ? '남은 시험 시간' : '현재시간';
  const timerValue = timerMode === 'countdown' ? formatTime(remainingSeconds) : formatClock(clock);

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-accent flex items-center justify-between px-6 z-[1000] text-accent-foreground shadow-md">
      <div className="text-sm font-medium">{registrationNumber || ''}</div>
      <div className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
        <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-8 object-contain brightness-0 invert mr-2 align-middle inline" />
        <span className="align-middle">{examTitle || 'IBT'}</span>
      </div>
      <div className={cn("text-base font-semibold tabular-nums", isWarning && "text-destructive")}>
        <span className="text-xs font-normal mr-1.5">{timerLabel}</span>
        {timerValue}
      </div>
    </div>
  );
}
