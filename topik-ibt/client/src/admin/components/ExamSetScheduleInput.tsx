import React from 'react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';

interface ExamSetScheduleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ExamSetScheduleInput: React.FC<ExamSetScheduleInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-gray-700">
        시험 시작 예정 시각
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange('')}
            disabled={disabled}
            className="text-gray-500"
          >
            초기화
          </Button>
        )}
      </div>
      <p className="m-0 text-xs text-gray-500">
        시작 시각을 설정하면 해당 시간에 시험이 자동으로 시작됩니다. 비워두면 수동 시작 모드로 전환됩니다.
      </p>
    </div>
  );
};

export default ExamSetScheduleInput;
