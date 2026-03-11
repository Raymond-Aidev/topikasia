import type { ExamSchedule } from '../types/registration.types';

interface Props {
  schedule: ExamSchedule | null;
  venueName?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
}

const styles = {
  panel: {
    width: 280,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E0E0E0',
    borderRadius: 12,
    padding: 24,
    fontFamily: 'sans-serif',
    position: 'sticky' as const,
    top: 136,
  },
  title: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: '#212121',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 600 as const,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#212121',
    fontWeight: 500 as const,
    lineHeight: 1.5,
    marginBottom: 16,
  },
  venueLabel: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: 600 as const,
    marginBottom: 4,
    marginTop: 8,
  },
  venueValue: {
    fontSize: 14,
    color: '#212121',
    marginBottom: 16,
  },
  button: (disabled: boolean) => ({
    width: '100%',
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#FFFFFF',
    backgroundColor: disabled ? '#A5D6A7' : '#4CAF50',
    border: 'none',
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: 12,
    transition: 'background-color 0.2s',
  }),
};

export default function ExamSelectionPanel({
  schedule,
  venueName,
  buttonLabel = '다음 단계로',
  onButtonClick,
  buttonDisabled = false,
}: Props) {
  return (
    <div style={styles.panel}>
      <div style={styles.title}>시험선택 내역</div>

      {schedule ? (
        <>
          <div style={styles.label}>시험명 및 수준</div>
          <div style={styles.value}>
            {schedule.examDate?.substring(0, 4)} 년도 제{schedule.examNumber}회 토픽
            <br />
            {schedule.examType === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
          </div>

          {venueName && (
            <>
              <div style={styles.venueLabel}>시험장</div>
              <div style={styles.venueValue}>{venueName}</div>
            </>
          )}
        </>
      ) : (
        <div style={{ fontSize: 14, color: '#9E9E9E', marginBottom: 16 }}>
          선택된 시험이 없습니다.
        </div>
      )}

      <button
        style={styles.button(buttonDisabled)}
        onClick={onButtonClick}
        disabled={buttonDisabled}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
