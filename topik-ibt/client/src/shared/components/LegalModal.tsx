/**
 * 이용약관 / 개인정보처리방침 모달 팝업
 */
import { useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../constants/legalTexts';

interface LegalModalProps {
  type: 'terms' | 'privacy';
  onClose: () => void;
}

const TITLES: Record<string, string> = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
};

export default function LegalModal({ type, onClose }: LegalModalProps) {
  const { isMobile } = useResponsive();
  const content = type === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? 16 : 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF', borderRadius: 16,
          width: isMobile ? '100%' : 720, maxWidth: 720,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '16px 20px' : '20px 28px',
          borderBottom: '1px solid #E0E0E0', flexShrink: 0,
        }}>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: '#111827' }}>
            {TITLES[type]}
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 24, color: '#9E9E9E', padding: '4px 8px',
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{
          padding: isMobile ? '20px' : '24px 28px',
          overflowY: 'auto', flex: 1,
          fontSize: 14, color: '#374151', lineHeight: 1.8,
          whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
          fontFamily: 'sans-serif',
        }}>
          {content}
        </div>

        {/* 하단 */}
        <div style={{
          padding: isMobile ? '12px 20px' : '16px 28px',
          borderTop: '1px solid #E0E0E0', flexShrink: 0,
          textAlign: 'right',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 32px', borderRadius: 8, border: 'none',
              backgroundColor: '#1565C0', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
