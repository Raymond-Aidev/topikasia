import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigationBar, { GNB_HEIGHT, GNB_HEIGHT_MOBILE } from '../../shared/components/GlobalNavigationBar';
import { useResponsive } from '../../shared/hooks/useResponsive';
import Footer from '../../shared/components/Footer';
import LegalModal from '../../shared/components/LegalModal';
import { signUp } from '../api/registrationApi';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';

export default function SignUpPage() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  const allAgreed = agreedTerms && agreedPrivacy;

  const handleAllAgree = (checked: boolean) => {
    setAgreedTerms(checked);
    setAgreedPrivacy(checked);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '이름을 입력하세요.';
    if (!email.trim()) errs.email = '이메일을 입력하세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = '올바른 이메일 형식이 아닙니다.';
    if (!password) errs.password = '비밀번호를 입력하세요.';
    else if (password.length < 8) errs.password = '8자 이상 입력하세요.';
    else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password))
      errs.password = '영문, 숫자, 특수문자를 포함해야 합니다.';
    if (password !== passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!agreedTerms) errs.agreedTerms = '이용약관에 동의해야 합니다.';
    if (!agreedPrivacy) errs.agreedPrivacy = '개인정보 수집·이용에 동의해야 합니다.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signUp({ name, email, password });
      navigate('/registration/verify-email', { state: { email: result.email || email } });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setServerError(msg || '회원가입에 실패했습니다. 잠시 후 다시 시도하세요.');
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
          'bg-white rounded-2xl shadow-lg box-border',
          isMobile ? 'w-[90%] max-w-[440px] p-6' : 'w-[440px] p-10'
        )}
        onSubmit={handleSubmit}
      >
        <div className="text-2xl font-extrabold text-[#1565C0] text-center mb-2">
          <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-9 object-contain mr-2 align-middle inline" />
          <span className="align-middle">회원가입</span>
        </div>
        <div className="text-sm text-gray-500 text-center mb-8">시험 접수를 위한 계정을 생성합니다</div>

        <div className="mb-4">
          <Label className="block text-[13px] font-semibold text-gray-700 mb-1.5">이름</Label>
          <Input
            className={cn('w-full px-3.5 py-3 text-[15px] rounded-lg', errors.name && 'border-red-800')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
          />
          {errors.name && <div className="text-xs text-red-800 mt-1">{errors.name}</div>}
        </div>

        <div className="mb-4">
          <Label className="block text-[13px] font-semibold text-gray-700 mb-1.5">이메일</Label>
          <Input
            className={cn('w-full px-3.5 py-3 text-[15px] rounded-lg', errors.email && 'border-red-800')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
          {errors.email && <div className="text-xs text-red-800 mt-1">{errors.email}</div>}
        </div>

        <div className="mb-4">
          <Label className="block text-[13px] font-semibold text-gray-700 mb-1.5">비밀번호</Label>
          <Input
            className={cn('w-full px-3.5 py-3 text-[15px] rounded-lg', errors.password && 'border-red-800')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상, 영문+숫자+특수문자"
          />
          {errors.password && <div className="text-xs text-red-800 mt-1">{errors.password}</div>}
        </div>

        <div className="mb-4">
          <Label className="block text-[13px] font-semibold text-gray-700 mb-1.5">비밀번호 확인</Label>
          <Input
            className={cn('w-full px-3.5 py-3 text-[15px] rounded-lg', errors.passwordConfirm && 'border-red-800')}
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 재입력"
          />
          {errors.passwordConfirm && <div className="text-xs text-red-800 mt-1">{errors.passwordConfirm}</div>}
        </div>

        {/* 약관 동의 영역 */}
        <div className="border border-gray-200 rounded-xl p-4 mb-5 bg-gray-50">
          {/* 전체 동의 */}
          <label className="flex items-center gap-2 cursor-pointer pb-3 mb-3 border-b border-gray-200 text-[15px] font-bold text-gray-900">
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={(e) => handleAllAgree(e.target.checked)}
              className="w-[18px] h-[18px] accent-[#1565C0]"
            />
            전체 동의
          </label>

          {/* 이용약관 동의 */}
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 flex-1">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 accent-[#1565C0]"
              />
              이용약관 동의 <span className="text-red-800 text-xs">(필수)</span>
            </label>
            <button
              type="button"
              className="text-xs text-[#1565C0] cursor-pointer bg-transparent border-none p-0 underline font-[inherit] shrink-0"
              onClick={() => setModalType('terms')}
            >
              약관보기
            </button>
          </div>
          {errors.agreedTerms && <div className="text-xs text-red-800 ml-6 mb-2">{errors.agreedTerms}</div>}

          {/* 개인정보 수집·이용 동의 */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 flex-1">
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={(e) => setAgreedPrivacy(e.target.checked)}
                className="w-4 h-4 accent-[#1565C0]"
              />
              개인정보 수집·이용 동의 <span className="text-red-800 text-xs">(필수)</span>
            </label>
            <button
              type="button"
              className="text-xs text-[#1565C0] cursor-pointer bg-transparent border-none p-0 underline font-[inherit] shrink-0"
              onClick={() => setModalType('privacy')}
            >
              약관보기
            </button>
          </div>
          {errors.agreedPrivacy && <div className="text-xs text-red-800 ml-6 mt-2">{errors.agreedPrivacy}</div>}
        </div>

        <Button
          type="submit"
          className={cn(
            'w-full py-3.5 text-base font-bold rounded-lg mt-2',
            loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#1565C0] hover:bg-[#1256A8] text-white'
          )}
          disabled={loading}
        >
          {loading ? '처리 중...' : '가입하기'}
        </Button>

        {serverError && (
          <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800 text-[13px]">{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="mt-5 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            className="text-[#1565C0] font-semibold cursor-pointer underline bg-transparent border-none text-sm"
            onClick={() => navigate('/registration/login')}
          >
            로그인
          </button>
        </div>
      </form>

      {modalType && <LegalModal type={modalType} onClose={() => setModalType(null)} />}
      </div>
      <Footer />
    </div>
  );
}
