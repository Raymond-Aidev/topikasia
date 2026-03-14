import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: any = { loginId, password };
      if (twoFactorCode) payload.twoFactorCode = twoFactorCode;
      const res = await adminApi.post('/admin-auth/login', payload);
      const token = res.data?.data?.token || res.data?.token;
      localStorage.setItem('adminToken', token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || '로그인에 실패했습니다.';
      setError(msg);
      // 2FA 관련 에러면 2FA 입력 필드 표시
      if (msg.includes('2단계 인증')) {
        setShow2FA(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-[400px]">
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="text-center mb-1">
              <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-10 object-contain mx-auto" />
            </div>
            <h1 className="text-xl font-bold text-center">관리자</h1>
            <p className="text-sm text-gray-500 text-center">
              관리자 계정으로 로그인하세요
            </p>

            {error && (
              <div className="px-3.5 py-2.5 rounded-md bg-red-100 text-red-800 text-[13px]">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="loginId">아이디</Label>
              <Input
                id="loginId"
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </div>

            <div className={cn('space-y-1.5', !show2FA && 'mb-2')}>
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 text-gray-500 text-sm"
                  tabIndex={-1}
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>
            </div>

            {show2FA && (
              <div className="space-y-1.5 mb-2">
                <Label htmlFor="twoFactor">2단계 인증 코드</Label>
                <Input
                  id="twoFactor"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="인증 코드를 입력하세요"
                  autoFocus
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white"
              size="lg"
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
