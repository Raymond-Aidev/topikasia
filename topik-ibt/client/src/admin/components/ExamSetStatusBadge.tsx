import React, { useEffect, useState } from 'react';

interface ExamSetStatusBadgeProps {
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  scheduledStartAt?: string | null;
  examStartedAt?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'DRAFT', bg: '#f3f4f6', color: '#374151' },
  ACTIVE: { label: 'ACTIVE', bg: '#dcfce7', color: '#166534' },
  ARCHIVED: { label: 'ARCHIVED', bg: '#f3f4f6', color: '#6b7280' },
};

const ExamSetStatusBadge: React.FC<ExamSetStatusBadgeProps> = ({
  status,
  scheduledStartAt,
  examStartedAt,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!scheduledStartAt || examStartedAt) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [scheduledStartAt, examStartedAt]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  const getScheduleText = () => {
    if (examStartedAt) return '시험 진행 중';
    if (!scheduledStartAt) return '수동 시작';

    const scheduled = new Date(scheduledStartAt);
    const diff = Math.floor((scheduled.getTime() - now.getTime()) / 1000);

    if (diff <= 0) return '시험 진행 중';
    if (diff <= 60) return `시작 임박 (${diff}초 후)`;

    const yyyy = scheduled.getFullYear();
    const mm = String(scheduled.getMonth() + 1).padStart(2, '0');
    const dd = String(scheduled.getDate()).padStart(2, '0');
    const hh = String(scheduled.getHours()).padStart(2, '0');
    const mi = String(scheduled.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi} 예정`;
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: config.bg,
          color: config.color,
        }}
      >
        {config.label}
      </span>
      {status === 'ACTIVE' && (
        <span style={{ fontSize: '12px', color: '#6b7280' }}>{getScheduleText()}</span>
      )}
    </span>
  );
};

export default ExamSetStatusBadge;
