import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RegistrationHeader from '../components/RegistrationHeader';
import { verifyEmail } from '../api/registrationApi';

const TIMER_SECONDS = 180; // 3분

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    fontFamily: 'sans-serif',
    paddingTop: 56,
  },
  card: {
    width: 440,
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: 800 as const,
    color: '#1565C0',
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  email: {
    fontWeight: 700 as const,
    color: '#212121',
  },
  codeRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  codeInput: {
    width: 44,
    height: 52,
    textAlign: 'center' as const,
    fontSize: 22,
    fontWeight: 700 as const,
    border: '2px solid #BDBDBD',
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'monospace',
  },
  codeInputFocused: {
    borderColor: '#1565C0',
  },
  timer: (expired: boolean) => ({
    fontSize: 20,
    fontWeight: 700 as const,
    color: expired ? '#C62828' : '#4CAF50',
    marginBottom: 24,
    fontVariantNumeric: 'tabular-nums' as const,
  }),
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
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
    cursor: 'not-allowed' as const,
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#1565C0',
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  resendDisabled: {
    color: '#BDBDBD',
    cursor: 'not-allowed' as const,
    textDecoration: 'none',
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
};

export default function EmailVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || '';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/registration/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 0) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('인증코드 6자리를 모두 입력하세요.');
      return;
    }
    if (seconds <= 0) {
      setError('인증 시간이 만료되었습니다. 코드를 재전송하세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyEmail({ email, code });
      navigate('/registration/login', { state: { verified: true } });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg || '인증코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setSeconds(TIMER_SECONDS);
    setCanResend(false);
    setDigits(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
    // In real app, call resend API here
  };

  return (
    <div style={styles.page}>
      <RegistrationHeader showUserMenu={false} />
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.title}>이메일 인증</div>
        <div style={styles.desc}>
          <span style={styles.email}>{email}</span> 으로
          <br />
          인증 코드를 발송했습니다.
        </div>

        <div style={styles.codeRow}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              style={styles.codeInput}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <div style={styles.timer(seconds <= 0)}>
          남은 시간: {formatTimer(seconds)}
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          disabled={loading}
        >
          {loading ? '확인 중...' : '인증 확인'}
        </button>

        <button
          type="button"
          style={{ ...styles.resendBtn, ...(canResend ? {} : styles.resendDisabled) }}
          onClick={handleResend}
          disabled={!canResend}
        >
          {canResend ? '인증코드 재전송' : '재전송 (시간 만료 후 가능)'}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>
    </div>
  );
}
