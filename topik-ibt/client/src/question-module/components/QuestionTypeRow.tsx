import React from 'react';
import type { QuestionTypeConfig } from '../config/questionTypes.config';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

interface Props {
  config: QuestionTypeConfig;
  loadedCount: number;
  selectedCount: number;
  onImport: () => void;
  loading: boolean;
}

const QuestionTypeRow: React.FC<Props> = ({
  config,
  loadedCount,
  selectedCount,
  onImport,
  loading,
}) => {
  return (
    <div className="flex items-center px-4 py-2.5 border-b border-gray-100 gap-3">
      <div className="flex-1 text-sm font-medium">{config.name}</div>
      <div className="text-[13px] text-gray-400 min-w-[80px] text-center">
        불러온: {loadedCount}
      </div>
      <div className="text-[13px] text-blue-600 min-w-[80px] text-center">
        선택: {selectedCount}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onImport}
        disabled={loading}
        className={cn(
          'text-blue-600 border-blue-600 whitespace-nowrap',
          loading && 'bg-blue-50 cursor-not-allowed'
        )}
      >
        {loading ? '불러오는 중...' : '문제 불러오기'}
      </Button>
    </div>
  );
};

export default QuestionTypeRow;
