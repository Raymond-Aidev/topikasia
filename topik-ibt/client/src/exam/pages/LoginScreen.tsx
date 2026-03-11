import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
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
    width: 400,
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  logo: {
    fontSize: 28,
    fontWeight: 800 as const,
    color: '#1565C0',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 16,
    textAlign: 'left' as const,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#424242',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    border: '1px solid #BDBDBD',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
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
    marginTop: 8,
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
    cursor: 'not-allowed' as const,
  },
  error: {
    marginTop: 16,
    padding: '10px 14px',
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid #FFCDD2',
  },
};

export default function LoginScreen() {
  const navigate = useNavigate();
  const setExaminee = useExamStore((s) => s.setExaminee);
  const setExamPhase = useExamStore((s) => s.setExamPhase);

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{9}$/.test(registrationNumber)) {
      setError('수험번호는 9자리 숫자입니다.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await examApi.post('/exam-auth/login', {
        registrationNumber,
        password,
      });

      const { token, examinee } = res.data;
      localStorage.setItem('examToken', token);
      setExaminee(examinee);
      setExamPhase('VERIFY');
      navigate('/exam/verify');
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      const message = err?.response?.data?.message;

      if (status === 423 || code === 'ACCOUNT_LOCKED') {
        setError('로그인 5회 실패로 계정이 잠겼습니다. 감독관에게 문의하세요.');
      } else if (status === 401) {
        setError(message || '수험번호 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('서버 연결에 실패했습니다. 잠시 후 다시 시도하세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.logo}>TOPIK IBT</div>
        <div style={styles.subtitle}>한국어능력시험 컴퓨터 기반 평가</div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>수험번호</label>
          <input
            style={styles.input}
            type="text"
            inputMode="numeric"
            maxLength={9}
            placeholder="9자리 수험번호 입력"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>비밀번호</label>
          <input
            style={styles.input}
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>
    </div>
  );
}
