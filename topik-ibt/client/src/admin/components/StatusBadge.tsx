import React from 'react';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

type ExamineeStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'LOCKED';
type SessionStatus = 'COMPLETED' | 'IN_PROGRESS' | 'TIMED_OUT' | 'ABANDONED';

interface StatusBadgeProps {
  status: string;
  type?: 'examinee' | 'session';
}

const EXAMINEE_STATUS_MAP: Record<ExamineeStatus, { label: string; className: string }> = {
  COMPLETED: { label: '완료', className: 'bg-green-100 text-green-800 border-transparent' },
  IN_PROGRESS: { label: '진행 중', className: 'bg-blue-100 text-blue-800 border-transparent' },
  NOT_STARTED: { label: '미응시', className: 'bg-gray-100 text-gray-700 border-transparent' },
  LOCKED: { label: '잠금', className: 'bg-red-100 text-red-800 border-transparent' },
};

const SESSION_STATUS_MAP: Record<SessionStatus, { label: string; className: string }> = {
  COMPLETED: { label: '완료', className: 'bg-green-100 text-green-800 border-transparent' },
  IN_PROGRESS: { label: '진행 중', className: 'bg-blue-100 text-blue-800 border-transparent' },
  TIMED_OUT: { label: '시간 초과', className: 'bg-amber-100 text-amber-800 border-transparent' },
  ABANDONED: { label: '중단', className: 'bg-red-100 text-red-800 border-transparent' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'examinee' }) => {
  const map = type === 'session' ? SESSION_STATUS_MAP : EXAMINEE_STATUS_MAP;
  const config = (map as any)[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-transparent' };

  return (
    <Badge
      variant="outline"
      className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className)}
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
