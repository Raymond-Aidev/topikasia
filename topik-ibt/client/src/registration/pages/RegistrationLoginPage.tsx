import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { login } from '../api/registrationApi';
import { useRegistrationStore } from '../store/registrationStore';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: GNB_HEIGHT,
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
  success: {
    marginTop: 16,
    padding: '10px 14px',
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid #C8E6C9',
  },
  linkRow: {
    marginTop: 20,
    fontSize: 14,
    color: '#757575',
  },
  link: {
    color: '#1565C0',
    fontWeight: 600 as const,
    cursor: 'pointer',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    fontSize: 14,
  },
};

export default function RegistrationLoginPage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useRegistrationStore((s) => s.setUser);
  const setLoggedIn = useRegistrationStore((s) => s.setLoggedIn);
  const selectedSchedule = useRegistrationStore((s) => s.selectedSchedule);

  const verified = (location.state as any)?.verified;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력하세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      const { token, user } = result.data;
      if (!token) throw new Error('토큰을 받지 못했습니다');
      localStorage.setItem('registrationToken', token);
      setUser(user);
      setLoggedIn(true);

      if (selectedSchedule) {
        navigate('/registration/apply');
      } else {
        navigate('/registration/schedules');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg || '이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F5F5F5', fontFamily: 'sans-serif',
      display: 'flex', flexDirection: 'column',
      paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT,
    }}>
      <GlobalNavigationBar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '32px 0' : '48px 0' }}>
      <form style={{ ...styles.card, width: isMobile ? '90%' : 400, maxWidth: 400, boxSizing: 'border-box' as const, padding: isMobile ? 24 : 40 }} onSubmit={handleSubmit}>
        <div style={styles.logo}>
          <img src="/logo_topikasia.png" alt="TOPIK Asia" style={{ height: 48, objectFit: 'contain' as const }} />
        </div>
        <div style={styles.subtitle}>시험 접수 로그인</div>

        {verified && (
          <div style={styles.success}>
            이메일 인증이 완료되었습니다. 로그인해 주세요.
          </div>
        )}

        <div style={styles.fieldGroup}>
          <label style={styles.label}>이메일</label>
          <input
            style={styles.input}
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>비밀번호</label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...styles.input, paddingRight: 44 }}
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                fontSize: 18, color: '#757575', lineHeight: 1,
              }}
              tabIndex={-1}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? '\u{1F441}' : '\u{1F441}\u{200D}\u{1F5E8}'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.linkRow}>
          계정이 없으신가요?{' '}
          <button
            type="button"
            style={styles.link}
            onClick={() => navigate('/registration/signup')}
          >
            회원가입
          </button>
        </div>
      </form>
      </div>
      <Footer />
    </div>
  );
}
