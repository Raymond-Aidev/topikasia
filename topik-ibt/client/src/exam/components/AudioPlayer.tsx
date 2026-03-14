import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';

interface AudioPlayerProps {
  audioUrl: string;
  maxPlays: number;
  questionId: string;
  autoPlay?: boolean;
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AudioPlayer({ audioUrl, maxPlays, questionId, autoPlay = true }: AudioPlayerProps) {
  const {
    isPlaying,
    progress,
    duration,
    currentTime,
    playCount,
    canPlay,
    togglePlayPause,
  } = useAudioPlayer({ audioUrl, maxPlays, questionId, autoPlay });

  const disabled = !canPlay && !isPlaying;

  return (
    <div className="my-3 flex items-center gap-3 rounded-lg bg-gray-100 px-4 py-3">
      <Button
        variant="default"
        size="icon"
        className={cn(
          'h-11 w-11 shrink-0 rounded-full text-lg',
          disabled && 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
        )}
        onClick={togglePlayPause}
        disabled={disabled}
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isPlaying ? '⏸' : '▶'}
      </Button>

      <div className="flex flex-1 flex-col gap-1">
        <Progress value={Math.min(progress * 100, 100)} className="h-1.5" />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>

      <div className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-gray-700">
        ({playCount}/{maxPlays}회)
      </div>
    </div>
  );
}
