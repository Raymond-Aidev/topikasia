import { useEffect, useState } from 'react';

interface ExamHeaderProps {
  registrationNumber?: string;
  examTitle?: string;
  timerMode: 'countdown' | 'clock';
  remainingSeconds?: number;
  onTimerExpire?: () => void;
}

const styles = {
  header: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: '#1565C0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
    color: '#fff',
    fontFamily: 'sans-serif',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  left: {
    fontSize: 14,
    fontWeight: 500 as const,
  },
  center: {
    fontSize: 18,
    fontWeight: 700 as const,
    position: 'absolute' as const,
    left: '50%',
    transform: 'translateX(-50%)',
  },
  right: {
    fontSize: 16,
    fontWeight: 600 as const,
    fontVariantNumeric: 'tabular-nums' as const,
  },
};

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
    <div style={styles.header}>
      <div style={styles.left}>{registrationNumber || ''}</div>
      <div style={styles.center}>
        <img src="/logo_topikasia.png" alt="TOPIK Asia" style={{ height: 32, objectFit: 'contain' as const, filter: 'brightness(0) invert(1)', marginRight: 8, verticalAlign: 'middle' }} />
        <span style={{ verticalAlign: 'middle' }}>{examTitle || 'IBT'}</span>
      </div>
      <div style={{ ...styles.right, color: isWarning ? '#FF5252' : '#fff' }}>
        <span style={{ fontSize: 12, fontWeight: 400, marginRight: 6 }}>{timerLabel}</span>
        {timerValue}
      </div>
    </div>
  );
}
