import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

interface ExamSetStatusBadgeProps {
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  scheduledStartAt?: string | null;
  examStartedAt?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'DRAFT', className: 'bg-gray-100 text-gray-700 border-transparent' },
  ACTIVE: { label: 'ACTIVE', className: 'bg-green-100 text-green-800 border-transparent' },
  ARCHIVED: { label: 'ARCHIVED', className: 'bg-gray-100 text-gray-500 border-transparent' },
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
    <span className="inline-flex items-center gap-1.5">
      <Badge
        variant="outline"
        className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className)}
      >
        {config.label}
      </Badge>
      {status === 'ACTIVE' && (
        <span className="text-xs text-gray-500">{getScheduleText()}</span>
      )}
    </span>
  );
};

export default ExamSetStatusBadge;
