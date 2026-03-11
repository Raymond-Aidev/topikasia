interface CountdownOverlayProps {
  seconds: number;
  totalSeconds?: number;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: '#0D47A1',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    fontFamily: 'sans-serif',
  },
  label: {
    fontSize: 22,
    color: '#90CAF9',
    marginBottom: 16,
    fontWeight: 500 as const,
  },
  number: {
    fontSize: 140,
    fontWeight: 800 as const,
    lineHeight: 1,
    marginBottom: 32,
    transition: 'color 0.3s',
  },
  progressContainer: {
    width: 320,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#42A5F5',
    borderRadius: 4,
    transition: 'width 0.5s linear',
  },
};

export default function CountdownOverlay({ seconds, totalSeconds = 10 }: CountdownOverlayProps) {
  const isUrgent = seconds <= 3 && seconds > 0;
  const display = seconds <= 0 ? '시작!' : String(seconds);
  const progress = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 100;

  return (
    <div style={styles.overlay}>
      <div style={styles.label}>시험이 곧 시작됩니다</div>
      <div
        style={{
          ...styles.number,
          color: isUrgent ? '#FF5252' : '#fff',
          fontSize: seconds <= 0 ? 80 : 140,
        }}
      >
        {display}
      </div>
      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressBar, width: `${progress}%` }} />
      </div>
    </div>
  );
}
