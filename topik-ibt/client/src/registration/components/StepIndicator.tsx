import { cn } from '../../lib/utils';

const STEPS = [
  { num: 1, label: 'STEP01', desc: '기본정보입력 단계' },
  { num: 2, label: 'STEP02', desc: '시험장 선택' },
  { num: 3, label: 'STEP03', desc: '정보 입력' },
  { num: 4, label: 'STEP04', desc: '접수 완료' },
];

interface Props {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function StepIndicator({ currentStep, onStepClick }: Props) {
  return (
    <div className="flex h-14 items-center border-b border-gray-300 bg-gray-100 px-6 font-sans">
      <div className="mr-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-200 text-base">
        🏠
      </div>
      <div className="mr-6 whitespace-nowrap text-base font-bold text-gray-900">
        시험접수
      </div>
      <div className="flex flex-1 items-center">
        {STEPS.map((step, idx) => {
          const isActive = step.num === currentStep;
          const isCompleted = step.num < currentStep;
          return (
            <div key={step.num} className="flex flex-1 items-center">
              <div
                className={cn(
                  'relative flex flex-1 flex-col px-6 py-2',
                  isCompleted ? 'cursor-pointer' : 'cursor-default'
                )}
                onClick={() => isCompleted && onStepClick?.(step.num)}
              >
                <span
                  className={cn(
                    'mb-0.5 text-[11px] font-semibold',
                    isActive || isCompleted ? 'text-green-500' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    'text-[13px]',
                    isActive ? 'font-bold text-green-500' : isCompleted ? 'font-normal text-green-500' : 'font-normal text-gray-400'
                  )}
                >
                  {isActive ? `현재는 ${step.desc}입니다.` : step.desc}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex items-center justify-center px-1 text-lg text-gray-400">
                  ▷
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
