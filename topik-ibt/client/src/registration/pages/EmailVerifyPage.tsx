import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { verifyEmail, resendCode } from '../api/registrationApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';

const TIMER_SECONDS = 180; // 3분

export default function EmailVerifyPage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
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

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    try {
      await resendCode(email);
      setSeconds(TIMER_SECONDS);
      setCanResend(false);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg || '인증코드 재전송에 실패했습니다.');
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-100 font-sans flex flex-col"
      style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}
    >
      <GlobalNavigationBar />
      <div className={cn('flex-1 flex items-center justify-center', isMobile ? 'py-8' : 'py-12')}>
      <form
        className={cn(
          'bg-white rounded-2xl shadow-lg text-center box-border',
          isMobile ? 'w-[90%] max-w-[440px] p-6' : 'w-[440px] p-10'
        )}
        onSubmit={handleSubmit}
      >
        <div className="text-2xl font-extrabold text-[#1565C0] mb-3">이메일 인증</div>
        <div className="text-sm text-gray-600 leading-relaxed mb-8">
          <span className="font-bold text-gray-900">{email}</span> 으로
          <br />
          인증 코드를 발송했습니다.
        </div>

        <div className="flex gap-2 justify-center mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className="w-11 h-[52px] text-center text-[22px] font-bold border-2 border-gray-300 rounded-lg outline-none font-mono focus:border-[#1565C0]"
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

        <div className={cn(
          'text-xl font-bold mb-6 tabular-nums',
          seconds <= 0 ? 'text-red-800' : 'text-green-600'
        )}>
          남은 시간: {formatTimer(seconds)}
        </div>

        <Button
          type="submit"
          className={cn(
            'w-full py-3.5 text-base font-bold rounded-lg mb-3',
            loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#1565C0] hover:bg-[#1256A8] text-white'
          )}
          disabled={loading}
        >
          {loading ? '확인 중...' : '인증 확인'}
        </Button>

        <button
          type="button"
          className={cn(
            'bg-transparent border-none text-sm font-semibold',
            canResend ? 'text-[#1565C0] cursor-pointer underline' : 'text-gray-300 cursor-not-allowed no-underline'
          )}
          onClick={handleResend}
          disabled={!canResend}
        >
          {canResend ? '인증코드 재전송' : '재전송 (시간 만료 후 가능)'}
        </button>

        {error && (
          <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800 text-[13px]">{error}</AlertDescription>
          </Alert>
        )}
      </form>
      </div>
      <Footer />
    </div>
  );
}
