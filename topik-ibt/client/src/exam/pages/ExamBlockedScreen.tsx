import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
  },
  card: {
    width: 420,
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: '#C62828',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#616161',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  button: {
    padding: '12px 32px',
    fontSize: 15,
    fontWeight: 600 as const,
    color: '#fff',
    backgroundColor: '#757575',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};

export default function ExamBlockedScreen() {
  const navigate = useNavigate();
  const reset = useExamStore((s) => s.reset);

  const handleLogout = () => {
    localStorage.removeItem('examToken');
    reset();
    navigate('/login', { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🚫</div>
        <div style={styles.title}>시험이 이미 시작되었습니다</div>
        <div style={styles.message}>
          시험 시작 시간이 지났습니다.<br />
          감독관에게 문의하세요.
        </div>
        <button style={styles.button} onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
