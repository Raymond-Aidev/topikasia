/**
 * 글로벌 네비게이션 바 (GNB)
 * 메인 홈페이지 + 소개 페이지용 (접수 내부 페이지는 RegistrationHeader 사용)
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegistrationStore } from '../../registration/store/registrationStore';

const UTILITY_HEIGHT = 40;
const MAIN_NAV_HEIGHT = 72;
export const GNB_HEIGHT = UTILITY_HEIGHT + MAIN_NAV_HEIGHT; // 112px

const MENU_ITEMS = [
  { label: '토픽아시아 소개', path: '/about' },
  { label: '시험별 안내', path: '/registration/schedules' },
  { label: '알림·소통', path: '/about' },
  { label: '학습하기', path: '/lms' },
];

const styles = {
  wrapper: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    fontFamily: 'sans-serif',
  },
  utilityBar: {
    height: UTILITY_HEIGHT,
    backgroundColor: '#FAFAFA',
    borderBottom: '1px solid #E0E0E0',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    padding: '0 24px',
    gap: 16,
  },
  utilityLink: {
    fontSize: 13,
    color: '#616161',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: 0,
    fontFamily: 'inherit',
  },
  utilityDivider: {
    color: '#BDBDBD',
    fontSize: 12,
  },
  mainNav: {
    height: MAIN_NAV_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E0E0E0',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '0 24px',
    maxWidth: 1280,
    margin: '0 auto',
  },
  mainNavOuter: {
    height: MAIN_NAV_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E0E0E0',
  },
  leftGroup: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  logo: {
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
  },
  logoImg: {
    height: 48,
    objectFit: 'contain' as const,
  },
  ctaBtn: {
    padding: '8px 22px',
    borderRadius: 24,
    border: 'none',
    fontSize: 14,
    fontWeight: 700 as const,
    cursor: 'pointer',
  },
  rightGroup: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 28,
  },
  menuLink: {
    fontSize: 16,
    fontWeight: 600 as const,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: '4px 0',
    fontFamily: 'inherit',
    borderBottom: '2px solid transparent',
  },
};

export default function GlobalNavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = useRegistrationStore((s) => s.isLoggedIn);
  const user = useRegistrationStore((s) => s.user);
  const setLoggedIn = useRegistrationStore((s) => s.setLoggedIn);
  const setUser = useRegistrationStore((s) => s.setUser);

  const handleLogout = () => {
    localStorage.removeItem('registrationToken');
    setLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  return (
    <div style={styles.wrapper}>
      {/* 유틸리티 바 */}
      <div style={styles.utilityBar}>
        {isLoggedIn && user ? (
          <>
            <span style={{ fontSize: 13, color: '#333' }}>
              <strong>{user.name}</strong>님
            </span>
            <span style={styles.utilityDivider}>|</span>
            <button style={styles.utilityLink} onClick={handleLogout}>
              로그아웃
            </button>
            <span style={styles.utilityDivider}>|</span>
            <button
              style={styles.utilityLink}
              onClick={() => navigate('/registration/mypage')}
            >
              마이페이지
            </button>
          </>
        ) : (
          <>
            <button
              style={styles.utilityLink}
              onClick={() => navigate('/registration/login')}
            >
              로그인
            </button>
            <span style={styles.utilityDivider}>|</span>
            <button
              style={styles.utilityLink}
              onClick={() => navigate('/registration/signup')}
            >
              회원가입
            </button>
          </>
        )}
        <span style={styles.utilityDivider}>|</span>
        <span style={{ fontSize: 13, color: '#616161' }}>
          🌐 한국어
        </span>
      </div>

      {/* 메인 내비게이션 */}
      <div style={styles.mainNavOuter}>
        <div style={styles.mainNav}>
          {/* 좌측: 로고 + CTA */}
          <div style={styles.leftGroup}>
            <div style={styles.logo} onClick={() => navigate('/')}>
              <img
                src="/logo_topikasia.png"
                alt="TOPIK Asia"
                style={styles.logoImg}
              />
            </div>
            <button
              style={{
                ...styles.ctaBtn,
                backgroundColor: '#1976D2',
                color: '#FFFFFF',
              }}
              onClick={() => navigate('/registration/schedules')}
            >
              시험접수
            </button>
            <button
              style={{
                ...styles.ctaBtn,
                backgroundColor: '#333333',
                color: '#FFFFFF',
              }}
              onClick={() => navigate('/exam/score')}
            >
              성적확인
            </button>
          </div>

          {/* 우측: 메뉴 */}
          <div style={styles.rightGroup}>
            {MENU_ITEMS.map((item) => (
              <button
                key={item.label}
                style={{
                  ...styles.menuLink,
                  color:
                    location.pathname === item.path ? '#1565C0' : '#333333',
                  borderBottomColor:
                    location.pathname === item.path
                      ? '#1565C0'
                      : 'transparent',
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
