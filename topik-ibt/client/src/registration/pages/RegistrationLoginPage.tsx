import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import { login } from '../api/registrationApi';
import { useRegistrationStore } from '../store/registrationStore';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';

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

      // 가드에서 리다이렉트된 경우 원래 경로로 복귀
      const returnTo = (location.state as any)?.from;
      if (returnTo) {
        navigate(returnTo);
      } else if (selectedSchedule) {
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
    <div
      className="min-h-screen bg-gray-100 font-sans flex flex-col"
      style={{ paddingTop: compact ? GNB_HEIGHT_MOBILE : GNB_HEIGHT }}
    >
      <GlobalNavigationBar />
      <div className={cn('flex-1 flex items-center justify-center', isMobile ? 'py-8' : 'py-12')}>
      <form
        className={cn(
          'bg-white rounded-2xl shadow-lg text-center box-border',
          isMobile ? 'w-[90%] max-w-[400px] p-6' : 'w-[400px] p-10'
        )}
        onSubmit={handleSubmit}
      >
        <div className="text-[28px] font-extrabold text-[#1565C0] mb-1">
          <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-12 object-contain" />
        </div>
        <div className="text-sm text-gray-500 mb-8">시험 접수 로그인</div>

        {verified && (
          <Alert className="mt-4 bg-green-50 border-green-200 mb-4">
            <AlertDescription className="text-green-700 text-[13px]">
              이메일 인증이 완료되었습니다. 로그인해 주세요.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4 text-left">
          <Label className="block text-[13px] font-semibold text-gray-700 mb-1.5">이메일</Label>
          <Input
            className="w-full px-3.5 py-3 text-[15px] rounded-lg"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mb-4 text-left">
          <Label className="block text-[13px] font-semibold text-gray-700 mb-1.5">비밀번호</Label>
          <div className="relative">
            <Input
              className="w-full px-3.5 py-3 pr-11 text-[15px] rounded-lg"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 text-lg text-gray-500 leading-none"
              tabIndex={-1}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? '\u{1F441}' : '\u{1F441}\u{200D}\u{1F5E8}'}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className={cn(
            'w-full py-3.5 text-base font-bold rounded-lg mt-2',
            loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#1565C0] hover:bg-[#1256A8] text-white'
          )}
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800 text-[13px]">{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-5 text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <button
            type="button"
            className="text-[#1565C0] font-semibold cursor-pointer underline bg-transparent border-none text-sm"
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
