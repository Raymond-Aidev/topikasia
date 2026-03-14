import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistrationStore } from '../store/registrationStore';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';

interface Props {
  showTimer?: boolean;
  showUserMenu?: boolean;
}

export default function RegistrationHeader({ showTimer = false, showUserMenu = true }: Props) {
  const navigate = useNavigate();
  const user = useRegistrationStore((s) => s.user);
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const setLoggedIn = useRegistrationStore((s) => s.setLoggedIn);
  const setUser = useRegistrationStore((s) => s.setUser);

  const [sessionSeconds, setSessionSeconds] = useState(3600);

  useEffect(() => {
    if (!showTimer) return;
    const interval = setInterval(() => {
      setSessionSeconds((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showTimer]);

  const formatTime = (totalSec: number) => {
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('registrationToken');
    setUser(null);
    setLoggedIn(false);
    navigate('/registration');
  };

  const handleExtend = () => {
    setSessionSeconds(3600);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-300 flex items-center justify-between px-6 font-sans z-[1000]">
      <div className="text-[22px] font-extrabold text-blue-800 cursor-pointer tracking-tight" onClick={() => navigate('/registration')}>
        <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-9 object-contain" />
      </div>

      <div className="flex items-center gap-4 text-sm">
        {isLoggedIn && user && showUserMenu && (
          <>
            <span className="text-gray-900 font-semibold">{user.name} 님</span>
            {showTimer && (
              <>
                <span className="text-green-600 font-bold text-base tabular-nums">{formatTime(sessionSeconds)}</span>
                <Button variant="outline" size="sm" className="border-green-600 text-green-600" onClick={handleExtend}>
                  연장
                </Button>
              </>
            )}
            <Separator orientation="vertical" className="h-5" />
            <Button variant="ghost" size="sm" className="text-gray-500 font-medium" onClick={handleLogout}>
              로그아웃
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button variant="ghost" size="sm" className="text-gray-500 font-medium" onClick={() => navigate('/registration/mypage')}>
              마이페이지
            </Button>
          </>
        )}
        {!isLoggedIn && showUserMenu && (
          <>
            <Button variant="ghost" size="sm" className="text-gray-500 font-medium" onClick={() => navigate('/registration/login')}>
              로그인
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button variant="ghost" size="sm" className="text-gray-500 font-medium" onClick={() => navigate('/registration/signup')}>
              회원가입
            </Button>
          </>
        )}
        <Separator orientation="vertical" className="h-5" />
        <Button variant="outline" size="sm" className="rounded-full text-[13px] text-gray-700">
          <span>🌐</span>
          <span>한국어</span>
        </Button>
      </div>
    </header>
  );
}
