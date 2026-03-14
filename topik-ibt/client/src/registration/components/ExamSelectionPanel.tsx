import type { ExamSchedule } from '../types/registration.types';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface Props {
  schedule: ExamSchedule | null;
  venueName?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
}

export default function ExamSelectionPanel({
  schedule,
  venueName,
  buttonLabel = '다음 단계로',
  onButtonClick,
  buttonDisabled = false,
}: Props) {
  return (
    <Card className="sticky top-[136px] w-[280px] font-sans">
      <CardContent>
        <div className="mb-5 text-lg font-bold text-gray-900">시험선택 내역</div>

        {schedule ? (
          <>
            <div className="mb-1 text-xs font-semibold text-green-500">시험명 및 수준</div>
            <div className="mb-4 text-[15px] font-medium leading-normal text-gray-900">
              {schedule.examDate?.substring(0, 4)} 년도 제{schedule.examNumber}회 토픽
              <br />
              {schedule.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
            </div>

            {venueName && (
              <>
                <div className="mb-1 mt-2 text-xs font-semibold text-blue-800">시험장</div>
                <div className="mb-4 text-sm text-gray-900">{venueName}</div>
              </>
            )}
          </>
        ) : (
          <div className="mb-4 text-sm text-gray-400">
            선택된 시험이 없습니다.
          </div>
        )}

        <Button
          className={cn(
            'mt-3 w-full py-3.5 text-base font-bold',
            buttonDisabled && 'bg-green-300 hover:bg-green-300'
          )}
          onClick={onButtonClick}
          disabled={buttonDisabled}
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
