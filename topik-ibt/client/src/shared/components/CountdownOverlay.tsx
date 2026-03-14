import { cn } from '../../lib/utils';

interface CountdownOverlayProps {
  seconds: number;
  totalSeconds?: number;
}

export default function CountdownOverlay({ seconds, totalSeconds = 10 }: CountdownOverlayProps) {
  const isUrgent = seconds <= 3 && seconds > 0;
  const display = seconds <= 0 ? '시작!' : String(seconds);
  const progress = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 100;

  return (
    <div className="fixed inset-0 bg-[#0D47A1] flex flex-col items-center justify-center z-[9999] font-sans">
      <div className="text-[22px] text-blue-300 mb-4 font-medium">시험이 곧 시작됩니다</div>
      <div
        className={cn(
          'font-extrabold leading-none mb-8 transition-colors duration-300',
          isUrgent ? 'text-red-400' : 'text-white',
          seconds <= 0 ? 'text-[80px]' : 'text-[140px]'
        )}
      >
        {display}
      </div>
      <div className="w-80 h-2 bg-white/20 rounded overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded transition-[width] duration-500 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
