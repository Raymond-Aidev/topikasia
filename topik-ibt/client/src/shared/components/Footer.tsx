/**
 * 공통 푸터 컴포넌트 — 반응형
 */
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

export default function Footer() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const linkStyle: React.CSSProperties = {
    color: '#B0BEC5', fontSize: 13, cursor: 'pointer',
    textDecoration: 'none', border: 'none', background: 'none',
    padding: 0, fontFamily: 'inherit',
  };

  return (
    <footer style={{ backgroundColor: '#1A237E', color: '#FFFFFF', fontFamily: 'sans-serif', padding: isMobile ? '32px 16px 24px' : '40px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 16 : 24,
          marginBottom: 20, paddingBottom: 20,
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}>
          <span
            style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <img
              src="/logo_topikasia.png" alt="TOPIK Asia"
              style={{ height: 32, objectFit: 'contain' as const, filter: 'brightness(0) invert(1)' }}
            />
          </span>
          <div style={{ display: 'flex', gap: isMobile ? 12 : 20, flexWrap: 'wrap' }}>
            <button style={linkStyle} onClick={() => navigate('/about')}>토픽아시아 소개</button>
            <span style={{ color: '#546E7A', fontSize: 12 }}>|</span>
            <button style={linkStyle}>이용약관</button>
            <span style={{ color: '#546E7A', fontSize: 12 }}>|</span>
            <button style={linkStyle}>개인정보처리방침</button>
            <span style={{ color: '#546E7A', fontSize: 12 }}>|</span>
            <button style={linkStyle}>고객센터</button>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 8 : 0,
        }}>
          <div style={{ fontSize: 12, color: '#78909C', lineHeight: 1.6 }}>
            © 2026 TOPIK Asia. All rights reserved.
          </div>
          <div style={{ fontSize: 12, color: '#78909C' }}>
            한국어능력시험 최고의 모의시험 플랫폼
          </div>
        </div>
      </div>
    </footer>
  );
}
