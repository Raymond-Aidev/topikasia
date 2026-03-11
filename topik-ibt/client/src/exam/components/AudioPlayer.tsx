import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface AudioPlayerProps {
  audioUrl: string;
  maxPlays: number;
  questionId: string;
  autoPlay?: boolean;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    margin: '12px 0',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#1565C0',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playButtonDisabled: {
    backgroundColor: '#BDBDBD',
    cursor: 'not-allowed',
  },
  progressContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1565C0',
    borderRadius: 3,
    transition: 'width 0.1s linear',
  },
  timeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#757575',
  },
  playCount: {
    fontSize: 13,
    color: '#424242',
    fontWeight: 600 as const,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
};

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
    <div style={styles.container}>
      <button
        style={{
          ...styles.playButton,
          ...(disabled ? styles.playButtonDisabled : {}),
        }}
        onClick={togglePlayPause}
        disabled={disabled}
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${Math.min(progress * 100, 100)}%`,
            }}
          />
        </div>
        <div style={styles.timeRow}>
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>

      <div style={styles.playCount}>
        ({playCount}/{maxPlays}회)
      </div>
    </div>
  );
}
