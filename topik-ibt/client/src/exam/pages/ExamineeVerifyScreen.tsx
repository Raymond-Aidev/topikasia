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
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: '#1565C0',
    marginBottom: 32,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '3px solid #1565C0',
    marginBottom: 20,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    backgroundColor: '#E0E0E0',
    border: '3px solid #1565C0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    color: '#9E9E9E',
    margin: '0 auto 20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 12,
  },
  infoItem: {
    textAlign: 'center' as const,
  },
  label: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: '#212121',
  },
  message: {
    fontSize: 14,
    color: '#424242',
    margin: '24px 0',
    lineHeight: 1.6,
  },
  button: {
    width: '100%',
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 700 as const,
    color: '#fff',
    backgroundColor: '#1565C0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};

export default function ExamineeVerifyScreen() {
  const navigate = useNavigate();
  const examinee = useExamStore((s) => s.examinee);

  if (!examinee) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>본인 확인</div>

        {examinee.photoUrl ? (
          <img src={examinee.photoUrl} alt="응시자 사진" style={styles.photo} />
        ) : (
          <div style={styles.photoPlaceholder}>👤</div>
        )}

        <div style={styles.infoRow}>
          <div style={styles.infoItem}>
            <div style={styles.label}>수험번호</div>
            <div style={styles.value}>{examinee.registrationNumber}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.label}>이름</div>
            <div style={styles.value}>{examinee.name}</div>
          </div>
        </div>

        <div style={styles.message}>
          본인이 맞으면 아래에서 시험을 선택하세요.
        </div>

        <button style={styles.button} onClick={() => navigate('/exam/select-set')}>
          시험 선택하기
        </button>
      </div>
    </div>
  );
}
