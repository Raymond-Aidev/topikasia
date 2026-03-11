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

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderBottom: '1px solid #E0E0E0',
    padding: '0 24px',
    height: 56,
    fontFamily: 'sans-serif',
  },
  homeIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
    marginRight: 12,
    cursor: 'pointer',
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#212121',
    marginRight: 24,
    whiteSpace: 'nowrap' as const,
  },
  stepsRow: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    gap: 0,
  },
  step: (isActive: boolean, isCompleted: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '8px 24px',
    cursor: isCompleted ? 'pointer' : 'default',
    position: 'relative' as const,
    flex: 1,
  }),
  stepLabel: (isActive: boolean, isCompleted: boolean) => ({
    fontSize: 11,
    fontWeight: 600 as const,
    color: isActive ? '#4CAF50' : isCompleted ? '#4CAF50' : '#9E9E9E',
    marginBottom: 2,
  }),
  stepDesc: (isActive: boolean, isCompleted: boolean) => ({
    fontSize: 13,
    fontWeight: isActive ? 700 : 400,
    color: isActive ? '#4CAF50' : isCompleted ? '#4CAF50' : '#9E9E9E',
  }),
  activePrefix: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 600 as const,
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#BDBDBD',
    padding: '0 4px',
  },
};

export default function StepIndicator({ currentStep, onStepClick }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.homeIcon}>🏠</div>
      <div style={styles.title}>시험접수</div>
      <div style={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isActive = step.num === currentStep;
          const isCompleted = step.num < currentStep;
          return (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                style={styles.step(isActive, isCompleted)}
                onClick={() => isCompleted && onStepClick?.(step.num)}
              >
                <span style={styles.stepLabel(isActive, isCompleted)}>
                  {step.label}
                </span>
                <span style={styles.stepDesc(isActive, isCompleted)}>
                  {isActive ? `현재는 ${step.desc}입니다.` : step.desc}
                </span>
              </div>
              {idx < STEPS.length - 1 && <div style={styles.arrow}>▷</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
