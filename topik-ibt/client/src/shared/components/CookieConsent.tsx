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
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
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
      <div className="fixed bottom-0 left-0 right-0 z-[1500] bg-primary text-primary-foreground shadow-[0_-4px_20px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-300">
        <div className={cn(
          "max-w-[1200px] mx-auto flex",
          isMobile ? "flex-col items-stretch gap-4 px-4 py-5" : "flex-row items-center gap-6 px-6 py-5"
        )}>
          {/* 안내 텍스트 */}
          <div className="flex-1">
            <div className={cn("font-bold mb-1.5", isMobile ? "text-sm" : "text-[15px]")}>
              쿠키 사용 안내
            </div>
            <div className={cn("text-primary-foreground/70 leading-relaxed", isMobile ? "text-xs" : "text-[13px]")}>
              TOPIK Asia는 서비스 이용 편의와 로그인 세션 유지를 위해 필수 쿠키를 사용하며,
              서비스 개선을 위한 분석 쿠키를 선택적으로 사용합니다.
              자세한 내용은{' '}
              <button
                onClick={() => setModalType('privacy')}
                className="text-accent/80 bg-transparent border-none p-0 cursor-pointer underline text-inherit"
              >
                개인정보처리방침
              </button>
              을 확인해 주세요.
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className={cn("flex gap-2.5 shrink-0", isMobile ? "flex-col" : "flex-row")}>
            <Button
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 whitespace-nowrap"
              onClick={handleAcceptEssential}
            >
              필수만 허용
            </Button>
            <Button
              className="bg-white text-primary hover:bg-white/90 font-bold whitespace-nowrap"
              onClick={handleAcceptAll}
            >
              모두 허용
            </Button>
          </div>
        </div>
      </div>

      {modalType && <LegalModal type={modalType} onClose={() => setModalType(null)} />}
    </>
  );
}
