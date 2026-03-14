/**
 * 이용약관 / 개인정보처리방침 모달 팝업
 */
import { useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
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
      className={cn("fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center", isMobile ? "p-4" : "p-6")}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[720px] max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={cn(
          "flex items-center justify-between border-b border-border shrink-0",
          isMobile ? "px-5 py-4" : "px-7 py-5"
        )}>
          <div className={cn("font-bold text-foreground", isMobile ? "text-lg" : "text-xl")}>
            {TITLES[type]}
          </div>
          <button
            onClick={onClose}
            className="border-none bg-transparent cursor-pointer text-2xl text-muted-foreground px-2 py-1 leading-none hover:text-foreground"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className={cn(
          "overflow-y-auto flex-1 text-sm text-foreground leading-[1.8] whitespace-pre-wrap break-keep",
          isMobile ? "p-5" : "px-7 py-6"
        )}>
          {content}
        </div>

        {/* 하단 */}
        <div className={cn(
          "border-t border-border shrink-0 text-right",
          isMobile ? "px-5 py-3" : "px-7 py-4"
        )}>
          <Button onClick={onClose} className="px-8">
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}
