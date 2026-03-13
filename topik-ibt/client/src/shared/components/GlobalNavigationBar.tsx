/**
 * 글로벌 네비게이션 바 (GNB) — 반응형
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegistrationStore } from '../../registration/store/registrationStore';
import { useResponsive } from '../hooks/useResponsive';

const UTILITY_HEIGHT = 40;
const MAIN_NAV_HEIGHT = 72;
const MOBILE_NAV_HEIGHT = 56;
export const GNB_HEIGHT = UTILITY_HEIGHT + MAIN_NAV_HEIGHT; // 112px desktop
export const GNB_HEIGHT_MOBILE = MOBILE_NAV_HEIGHT; // 56px mobile

const MENU_ITEMS = [
  { label: '토픽아시아 소개', path: '/about' },
  { label: '시험별 안내', path: '/registration/schedules' },
  { label: '알림·소통', path: '/about' },
  { label: '학습하기', path: '/lms' },
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: MOBILE_NAV_HEIGHT, backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', fontFamily: 'sans-serif',
        }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleNav('/')}>
            <img src="/logo_topikasia.png" alt="TOPIK Asia" style={{ height: 36, objectFit: 'contain' as const }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                fontSize: 12, fontWeight: 700, backgroundColor: '#1976D2', color: '#fff', cursor: 'pointer',
              }}
              onClick={() => handleNav('/registration/schedules')}
            >
              시험접수
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 24, padding: '4px 8px', color: '#333',
              }}
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
              style={{
                position: 'fixed', top: MOBILE_NAV_HEIGHT, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999,
              }}
              onClick={() => setMenuOpen(false)}
            />
            <div style={{
              position: 'fixed', top: MOBILE_NAV_HEIGHT, left: 0, right: 0,
              backgroundColor: '#FFFFFF', zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '8px 0', fontFamily: 'sans-serif',
            }}>
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '14px 20px', border: 'none', background: 'none',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    color: location.pathname === item.path ? '#1565C0' : '#333',
                    backgroundColor: location.pathname === item.path ? '#F0F7FF' : 'transparent',
                  }}
                >
                  {item.label}
                </button>
              ))}
              <div style={{ height: 1, backgroundColor: '#E0E0E0', margin: '4px 0' }} />
              <button
                onClick={() => handleNav('/exam/score')}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '14px 20px', border: 'none', background: 'none',
                  fontSize: 14, fontWeight: 600, color: '#333', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                성적확인
              </button>
              <div style={{ height: 1, backgroundColor: '#E0E0E0', margin: '4px 0' }} />
              {isLoggedIn && user ? (
                <>
                  <div style={{ padding: '10px 20px', fontSize: 13, color: '#616161' }}>
                    <strong>{user.name}</strong>님
                  </div>
                  <button
                    onClick={() => handleNav('/registration/mypage')}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '12px 20px', border: 'none', background: 'none',
                      fontSize: 14, color: '#333', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    마이페이지
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '12px 20px', border: 'none', background: 'none',
                      fontSize: 14, color: '#C62828', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 8, padding: '12px 20px' }}>
                  <button
                    onClick={() => handleNav('/registration/login')}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 6,
                      border: '1px solid #1565C0', background: '#fff',
                      color: '#1565C0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => handleNav('/registration/signup')}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 6,
                      border: 'none', backgroundColor: '#1565C0',
                      color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    회원가입
                  </button>
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, fontFamily: 'sans-serif' }}>
      {/* 유틸리티 바 */}
      <div style={{
        height: UTILITY_HEIGHT, backgroundColor: '#FAFAFA',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 24px', gap: 16,
      }}>
        {isLoggedIn && user ? (
          <>
            <span style={{ fontSize: 13, color: '#333' }}><strong>{user.name}</strong>님</span>
            <span style={{ color: '#BDBDBD', fontSize: 12 }}>|</span>
            <button onClick={handleLogout} style={{ fontSize: 13, color: '#616161', cursor: 'pointer', border: 'none', background: 'none', padding: 0, fontFamily: 'inherit' }}>로그아웃</button>
            <span style={{ color: '#BDBDBD', fontSize: 12 }}>|</span>
            <button onClick={() => navigate('/registration/mypage')} style={{ fontSize: 13, color: '#616161', cursor: 'pointer', border: 'none', background: 'none', padding: 0, fontFamily: 'inherit' }}>마이페이지</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/registration/login')} style={{ fontSize: 13, color: '#616161', cursor: 'pointer', border: 'none', background: 'none', padding: 0, fontFamily: 'inherit' }}>로그인</button>
            <span style={{ color: '#BDBDBD', fontSize: 12 }}>|</span>
            <button onClick={() => navigate('/registration/signup')} style={{ fontSize: 13, color: '#616161', cursor: 'pointer', border: 'none', background: 'none', padding: 0, fontFamily: 'inherit' }}>회원가입</button>
          </>
        )}
        <span style={{ color: '#BDBDBD', fontSize: 12 }}>|</span>
        <span style={{ fontSize: 13, color: '#616161' }}>🌐 한국어</span>
      </div>

      {/* 메인 내비게이션 */}
      <div style={{ height: MAIN_NAV_HEIGHT, backgroundColor: '#FFFFFF', borderBottom: '2px solid #E0E0E0' }}>
        <div style={{
          height: MAIN_NAV_HEIGHT, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 24px',
          maxWidth: 1200, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
              <img src="/logo_topikasia.png" alt="TOPIK Asia" style={{ height: 48, objectFit: 'contain' as const }} />
            </div>
            <button
              style={{ padding: '8px 22px', borderRadius: 24, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', backgroundColor: '#1976D2', color: '#FFFFFF' }}
              onClick={() => navigate('/registration/schedules')}
            >
              시험접수
            </button>
            <button
              style={{ padding: '8px 22px', borderRadius: 24, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', backgroundColor: '#333333', color: '#FFFFFF' }}
              onClick={() => navigate('/exam/score')}
            >
              성적확인
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {MENU_ITEMS.map((item) => (
              <button
                key={item.label}
                style={{
                  fontSize: 16, fontWeight: 600, cursor: 'pointer',
                  border: 'none', background: 'none', padding: '4px 0',
                  fontFamily: 'inherit',
                  borderBottom: '2px solid',
                  color: location.pathname === item.path ? '#1565C0' : '#333333',
                  borderBottomColor: location.pathname === item.path ? '#1565C0' : 'transparent',
                }}
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
