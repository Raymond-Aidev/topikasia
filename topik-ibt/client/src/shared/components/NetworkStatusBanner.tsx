import { useExamStore } from '../../store/examStore';

const styles = {
  banner: {
    position: 'fixed' as const,
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#FF9800',
    color: '#fff',
    textAlign: 'center' as const,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600 as const,
    zIndex: 999,
    fontFamily: 'sans-serif',
  },
};

export default function NetworkStatusBanner() {
  const hasNetworkError = useExamStore((s) => s.hasNetworkError);

  if (!hasNetworkError) return null;

  return (
    <div style={styles.banner}>
      네트워크 연결이 불안정합니다. 답안 저장에 실패할 수 있습니다.
    </div>
  );
}
