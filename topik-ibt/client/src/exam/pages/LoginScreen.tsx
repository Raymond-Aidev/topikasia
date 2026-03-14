import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { useExamStore } from '../../store/examStore';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <Card className="w-[400px] p-10 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] text-center">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="mb-1">
              <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-12 object-contain mx-auto mb-2" />
            </div>
            <div className="text-sm text-gray-500 mb-8">한국어능력시험 컴퓨터 기반 평가</div>

            <div className="mb-4 text-left">
              <Label className="block text-[13px] font-semibold text-gray-700 mb-1.5">수험번호</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={9}
                placeholder="9자리 수험번호 입력"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full px-3.5 py-3 text-[15px] border border-gray-400 rounded-lg transition-colors h-auto"
              />
            </div>

            <div className="mb-4 text-left">
              <Label className="block text-[13px] font-semibold text-gray-700 mb-1.5">비밀번호</Label>
              <Input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 text-[15px] border border-gray-400 rounded-lg transition-colors h-auto"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3.5 text-base font-bold rounded-lg mt-2 h-auto',
                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900'
              )}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>

            {error && (
              <div className="mt-4 px-3.5 py-2.5 bg-red-50 text-red-800 text-[13px] rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
