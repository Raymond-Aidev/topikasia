import React from 'react';

type ExamineeStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'LOCKED';
type SessionStatus = 'COMPLETED' | 'IN_PROGRESS' | 'TIMED_OUT' | 'ABANDONED';

interface StatusBadgeProps {
  status: string;
  type?: 'examinee' | 'session';
}

const EXAMINEE_STATUS_MAP: Record<ExamineeStatus, { label: string; bg: string; color: string }> = {
  COMPLETED: { label: '완료', bg: '#dcfce7', color: '#166534' },
  IN_PROGRESS: { label: '진행 중', bg: '#dbeafe', color: '#1e40af' },
  NOT_STARTED: { label: '미응시', bg: '#f3f4f6', color: '#374151' },
  LOCKED: { label: '잠금', bg: '#fee2e2', color: '#991b1b' },
};

const SESSION_STATUS_MAP: Record<SessionStatus, { label: string; bg: string; color: string }> = {
  COMPLETED: { label: '완료', bg: '#dcfce7', color: '#166534' },
  IN_PROGRESS: { label: '진행 중', bg: '#dbeafe', color: '#1e40af' },
  TIMED_OUT: { label: '시간 초과', bg: '#fef3c7', color: '#92400e' },
  ABANDONED: { label: '중단', bg: '#fee2e2', color: '#991b1b' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'examinee' }) => {
  const map = type === 'session' ? SESSION_STATUS_MAP : EXAMINEE_STATUS_MAP;
  const config = (map as any)[status] || { label: status, bg: '#f3f4f6', color: '#374151' };

  return (
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
  );
};

export default StatusBadge;
