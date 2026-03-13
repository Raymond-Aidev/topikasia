/**
 * 공통 푸터 컴포넌트
 */
import { useNavigate } from 'react-router-dom';

const styles = {
  footer: {
    backgroundColor: '#1A237E',
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    padding: '40px 24px 32px',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
  },
  topRow: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 24,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: '1px solid rgba(255,255,255,0.15)',
  },
  logo: {
    fontSize: 20,
    fontWeight: 800 as const,
    letterSpacing: -0.5,
    cursor: 'pointer',
  },
  linkRow: {
    display: 'flex' as const,
    gap: 20,
  },
  link: {
    color: '#B0BEC5',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'none' as const,
    border: 'none',
    background: 'none',
    padding: 0,
    fontFamily: 'inherit',
  },
  bottomRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  copyright: {
    fontSize: 12,
    color: '#78909C',
    lineHeight: 1.6,
  },
  tagline: {
    fontSize: 12,
    color: '#78909C',
  },
};

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.topRow}>
          <span style={styles.logo} onClick={() => navigate('/')}>
            <img
              src="/logo_topikasia.png"
              alt="TOPIK Asia"
              style={{ height: 32, objectFit: 'contain' as const, filter: 'brightness(0) invert(1)' }}
            />
          </span>
          <div style={styles.linkRow}>
            <button style={styles.link} onClick={() => navigate('/about')}>
              토픽아시아 소개
            </button>
            <span style={{ color: '#546E7A', fontSize: 12 }}>|</span>
            <button style={styles.link}>이용약관</button>
            <span style={{ color: '#546E7A', fontSize: 12 }}>|</span>
            <button style={styles.link}>개인정보처리방침</button>
            <span style={{ color: '#546E7A', fontSize: 12 }}>|</span>
            <button style={styles.link}>고객센터</button>
          </div>
        </div>
        <div style={styles.bottomRow}>
          <div style={styles.copyright}>
            © 2026 TOPIK Asia. All rights reserved.
          </div>
          <div style={styles.tagline}>
            한국어능력시험 최고의 모의시험 플랫폼
          </div>
        </div>
      </div>
    </footer>
  );
}
