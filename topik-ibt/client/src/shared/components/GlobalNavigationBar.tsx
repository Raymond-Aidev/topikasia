/**
 * 글로벌 네비게이션 바 (GNB) — 반응형
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegistrationStore } from '../../registration/store/registrationStore';
import { useResponsive } from '../hooks/useResponsive';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';

const UTILITY_HEIGHT = 40;
const MAIN_NAV_HEIGHT = 72;
const MOBILE_NAV_HEIGHT = 56;
export const GNB_HEIGHT = UTILITY_HEIGHT + MAIN_NAV_HEIGHT; // 112px desktop
export const GNB_HEIGHT_MOBILE = MOBILE_NAV_HEIGHT; // 56px mobile

const MENU_ITEMS = [
  { label: '토픽아시아 소개', path: '/about' },
  { label: '시험별 안내', path: '/registration/schedules' },
  { label: '알림·소통', path: '/notice' },
  { label: 'LMS', path: '/lms' },
];

export default function GlobalNavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useResponsive();
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const user = useRegistrationStore((s) => s.user);
  const setLoggedIn = useRegistrationStore((s) => s.setLoggedIn);
  const setUser = useRegistrationStore((s) => s.setUser);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('registrationToken');
    setLoggedIn(false);
    setUser(null);
    navigate('/');
    setMenuOpen(false);
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const compact = isMobile || isTablet;

  // ── Mobile / Tablet ──
  if (compact) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between border-b border-border bg-white px-4" style={{ height: MOBILE_NAV_HEIGHT }}>
          <div className="cursor-pointer flex items-center" onClick={() => handleNav('/')}>
            <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-9 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="rounded-full bg-accent text-accent-foreground text-xs font-bold"
              onClick={() => handleNav('/registration/schedules')}
            >
              시험접수
            </Button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="border-none bg-transparent cursor-pointer text-2xl px-2 py-1 text-foreground"
              aria-label="메뉴"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* 모바일 드로어 */}
        {menuOpen && (
          <>
            <div
              className="fixed left-0 right-0 bottom-0 bg-black/30 z-[999]"
              style={{ top: MOBILE_NAV_HEIGHT }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="fixed left-0 right-0 bg-white z-[1000] shadow-lg py-2"
              style={{ top: MOBILE_NAV_HEIGHT }}
            >
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "block w-full text-left px-5 py-3.5 border-none bg-transparent text-[15px] font-semibold cursor-pointer",
                    location.pathname === item.path
                      ? "text-accent bg-accent/10"
                      : "text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
              <Separator />
              <button
                onClick={() => handleNav('/exam/score')}
                className="block w-full text-left px-5 py-3.5 border-none bg-transparent text-sm font-semibold text-foreground cursor-pointer"
              >
                성적확인
              </button>
              <Separator />
              {isLoggedIn && user ? (
                <>
                  <div className="px-5 py-2.5 text-[13px] text-muted-foreground">
                    <strong>{user.name}</strong>님
                  </div>
                  <button
                    onClick={() => handleNav('/registration/mypage')}
                    className="block w-full text-left px-5 py-3 border-none bg-transparent text-sm text-foreground cursor-pointer"
                  >
                    마이페이지
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-5 py-3 border-none bg-transparent text-sm text-destructive cursor-pointer"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-5 py-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-accent text-accent"
                    onClick={() => handleNav('/registration/login')}
                  >
                    로그인
                  </Button>
                  <Button
                    className="flex-1 bg-accent text-accent-foreground"
                    onClick={() => handleNav('/registration/signup')}
                  >
                    회원가입
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  // ── Desktop ──
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000]">
      {/* 유틸리티 바 */}
      <div className="flex items-center justify-end gap-4 border-b border-border bg-muted px-6" style={{ height: UTILITY_HEIGHT }}>
        {isLoggedIn && user ? (
          <>
            <span className="text-[13px] text-foreground"><strong>{user.name}</strong>님</span>
            <span className="text-muted-foreground text-xs">|</span>
            <button onClick={handleLogout} className="text-[13px] text-muted-foreground cursor-pointer border-none bg-transparent p-0">로그아웃</button>
            <span className="text-muted-foreground text-xs">|</span>
            <button onClick={() => navigate('/registration/mypage')} className="text-[13px] text-muted-foreground cursor-pointer border-none bg-transparent p-0">마이페이지</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/registration/login')} className="text-[13px] text-muted-foreground cursor-pointer border-none bg-transparent p-0">로그인</button>
            <span className="text-muted-foreground text-xs">|</span>
            <button onClick={() => navigate('/registration/signup')} className="text-[13px] text-muted-foreground cursor-pointer border-none bg-transparent p-0">회원가입</button>
          </>
        )}
        <span className="text-muted-foreground text-xs">|</span>
        <span className="text-[13px] text-muted-foreground">🌐 한국어</span>
      </div>

      {/* 메인 내비게이션 */}
      <div className="bg-white border-b-2 border-border" style={{ height: MAIN_NAV_HEIGHT }}>
        <div className="flex items-center justify-between px-6 max-w-[1200px] mx-auto" style={{ height: MAIN_NAV_HEIGHT }}>
          <div className="flex items-center gap-4">
            <div className="cursor-pointer flex items-center" onClick={() => navigate('/')}>
              <img src="/logo_topikasia.png" alt="TOPIK Asia" className="h-12 object-contain" />
            </div>
            <Button
              className="rounded-full bg-accent text-accent-foreground font-bold"
              onClick={() => navigate('/registration/schedules')}
            >
              시험접수
            </Button>
            <Button
              className="rounded-full bg-primary text-primary-foreground font-bold"
              onClick={() => navigate('/exam/score')}
            >
              성적확인
            </Button>
          </div>
          <div className="flex items-center gap-7">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "text-base font-semibold cursor-pointer border-none bg-transparent py-1 border-b-2",
                  location.pathname === item.path
                    ? "text-accent border-b-accent"
                    : "text-foreground border-b-transparent"
                )}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
