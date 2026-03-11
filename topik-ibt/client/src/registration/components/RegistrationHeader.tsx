import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistrationStore } from '../store/registrationStore';

interface Props {
  showTimer?: boolean;
  showUserMenu?: boolean;
}

const styles = {
  header: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E0E0E0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    fontFamily: 'sans-serif',
    zIndex: 1000,
  },
  logo: {
    fontSize: 22,
    fontWeight: 800 as const,
    color: '#1565C0',
    cursor: 'pointer',
    letterSpacing: -0.5,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    fontSize: 14,
  },
  userName: {
    color: '#212121',
    fontWeight: 600 as const,
  },
  timer: {
    color: '#4CAF50',
    fontWeight: 700 as const,
    fontSize: 16,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  extendBtn: {
    padding: '4px 12px',
    fontSize: 12,
    border: '1px solid #4CAF50',
    borderRadius: 4,
    backgroundColor: '#fff',
    color: '#4CAF50',
    cursor: 'pointer',
    fontWeight: 600 as const,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: '#616161',
    cursor: 'pointer',
    padding: '4px 8px',
    fontWeight: 500 as const,
  },
  langSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: 20,
    fontSize: 13,
    color: '#424242',
    cursor: 'pointer',
    backgroundColor: '#fff',
  },
};

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
    <header style={styles.header}>
      <div style={styles.logo} onClick={() => navigate('/registration')}>
        TOPIK
      </div>

      <div style={styles.rightSection}>
        {isLoggedIn && user && showUserMenu && (
          <>
            <span style={styles.userName}>{user.name} 님</span>
            {showTimer && (
              <>
                <span style={styles.timer}>{formatTime(sessionSeconds)}</span>
                <button style={styles.extendBtn} onClick={handleExtend}>
                  연장
                </button>
              </>
            )}
            <div style={styles.divider} />
            <button style={styles.menuBtn} onClick={handleLogout}>
              로그아웃
            </button>
            <div style={styles.divider} />
            <button style={styles.menuBtn} onClick={() => navigate('/registration/mypage')}>
              마이페이지
            </button>
          </>
        )}
        {!isLoggedIn && showUserMenu && (
          <>
            <button style={styles.menuBtn} onClick={() => navigate('/registration/login')}>
              로그인
            </button>
            <div style={styles.divider} />
            <button style={styles.menuBtn} onClick={() => navigate('/registration/signup')}>
              회원가입
            </button>
          </>
        )}
        <div style={styles.divider} />
        <button style={styles.langSelect}>
          <span>🌐</span>
          <span>한국어</span>
        </button>
      </div>
    </header>
  );
}
