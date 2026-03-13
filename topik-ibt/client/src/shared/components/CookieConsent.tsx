/**
 * 쿠키 동의 배너 — 하단 고정, 첫 방문 시 표시
 *
 * 규정 근거:
 * - 한국 「개인정보 보호법」 제22조 (동의를 받는 방법)
 * - 한국 「정보통신망법」 제22조의2 (접근권한 등)
 * - EU GDPR Article 7 (쿠키 동의, 해외 이용자 대응)
 *
 * 동의 상태는 localStorage에 저장하여 재방문 시 배너를 숨깁니다.
 */
import { useState, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import LegalModal from './LegalModal';

const CONSENT_KEY = 'cookieConsent';

export default function CookieConsent() {
  const { isMobile } = useResponsive();
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // 약간의 딜레이 후 표시 (페이지 로드 후 자연스럽게)
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ essential: true, analytics: true, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ essential: true, analytics: false, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1500,
        backgroundColor: '#1A237E', color: '#FFFFFF',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
        fontFamily: 'sans-serif',
        animation: 'slideUp 0.3s ease-out',
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: isMobile ? '20px 16px' : '20px 24px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 16 : 24,
        }}>
          {/* 안내 텍스트 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, marginBottom: 6 }}>
              쿠키 사용 안내
            </div>
            <div style={{ fontSize: isMobile ? 12 : 13, color: '#B0BEC5', lineHeight: 1.6 }}>
              TOPIK Asia는 서비스 이용 편의와 로그인 세션 유지를 위해 필수 쿠키를 사용하며,
              서비스 개선을 위한 분석 쿠키를 선택적으로 사용합니다.
              자세한 내용은{' '}
              <button
                onClick={() => setModalType('privacy')}
                style={{
                  color: '#90CAF9', background: 'none', border: 'none',
                  padding: 0, cursor: 'pointer', textDecoration: 'underline',
                  fontSize: 'inherit', fontFamily: 'inherit',
                }}
              >
                개인정보처리방침
              </button>
              을 확인해 주세요.
            </div>
          </div>

          {/* 버튼 영역 */}
          <div style={{
            display: 'flex', gap: 10, flexShrink: 0,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <button
              onClick={handleAcceptEssential}
              style={{
                padding: isMobile ? '10px 16px' : '10px 20px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                backgroundColor: 'transparent', color: '#FFFFFF',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              필수만 허용
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                padding: isMobile ? '10px 16px' : '10px 20px',
                borderRadius: 8, border: 'none',
                backgroundColor: '#FFFFFF', color: '#1A237E',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              모두 허용
            </button>
          </div>
        </div>
      </div>

      {modalType && <LegalModal type={modalType} onClose={() => setModalType(null)} />}
    </>
  );
}
