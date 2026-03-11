interface ExamNavigationProps {
  onPrev?: () => void;
  onNext?: () => void;
  onShowAll?: () => void;
  showAllButton?: boolean;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
}

const styles = {
  bar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#F5F5F5',
    borderTop: '1px solid #E0E0E0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
  },
  button: {
    padding: '10px 24px',
    fontSize: 15,
    fontWeight: 600 as const,
    border: '1px solid #1565C0',
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: '#fff',
    color: '#1565C0',
    transition: 'background-color 0.15s',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed' as const,
  },
  centerButton: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500 as const,
    border: '1px solid #90CAF9',
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
  },
};

export default function ExamNavigation({
  onPrev,
  onNext,
  onShowAll,
  showAllButton = false,
  prevDisabled = false,
  nextDisabled = false,
  nextLabel = '다음 >',
}: ExamNavigationProps) {
  return (
    <div style={styles.bar}>
      <button
        style={{ ...styles.button, ...(prevDisabled ? styles.buttonDisabled : {}) }}
        onClick={onPrev}
        disabled={prevDisabled}
      >
        {'< 이전'}
      </button>

      {showAllButton && (
        <button style={styles.centerButton} onClick={onShowAll}>
          전체 문제
        </button>
      )}

      <button
        style={{ ...styles.button, ...(nextDisabled ? styles.buttonDisabled : {}) }}
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </button>
    </div>
  );
}
