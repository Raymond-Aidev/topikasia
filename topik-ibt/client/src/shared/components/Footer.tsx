/**
 * 공통 푸터 컴포넌트 — 반응형
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import { cn } from '../../lib/utils';
import LegalModal from './LegalModal';

export default function Footer() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  return (
    <>
      <footer className={cn("bg-primary text-primary-foreground", isMobile ? "px-4 pt-8 pb-6" : "px-6 pt-10 pb-8")}>
        <div className="max-w-[1200px] mx-auto">
          <div className={cn(
            "flex gap-6 mb-5 pb-5 border-b border-white/15",
            isMobile ? "flex-col items-start gap-4" : "flex-row items-center"
          )}>
            <span
              className="text-xl font-extrabold tracking-tight cursor-pointer"
              onClick={() => navigate('/')}
            >
              <img
                src="/logo_topikasia.png" alt="TOPIK Asia"
                className="h-8 object-contain brightness-0 invert"
              />
            </span>
            <div className={cn("flex flex-wrap", isMobile ? "gap-3" : "gap-5")}>
              <button className="text-[13px] text-white/70 cursor-pointer border-none bg-transparent p-0 hover:text-white" onClick={() => navigate('/about')}>토픽아시아 소개</button>
              <span className="text-xs text-white/30">|</span>
              <button className="text-[13px] text-white/70 cursor-pointer border-none bg-transparent p-0 hover:text-white" onClick={() => setModalType('terms')}>이용약관</button>
              <span className="text-xs text-white/30">|</span>
              <button className="text-[13px] font-bold text-white cursor-pointer border-none bg-transparent p-0 hover:text-white/90" onClick={() => setModalType('privacy')}>개인정보처리방침</button>
              <span className="text-xs text-white/30">|</span>
              <button className="text-[13px] text-white/70 cursor-pointer border-none bg-transparent p-0 hover:text-white" onClick={() => navigate('/about')}>고객센터</button>
            </div>
          </div>
          <div className={cn(
            "flex justify-between",
            isMobile ? "flex-col items-start gap-2" : "flex-row items-center"
          )}>
            <div className="text-xs text-white/50 leading-relaxed">
              © 2026 TOPIK Asia. All rights reserved.
            </div>
            <div className="text-xs text-white/50">
              한국어능력시험 최고의 모의시험 플랫폼
            </div>
          </div>
        </div>
      </footer>

      {modalType && <LegalModal type={modalType} onClose={() => setModalType(null)} />}
    </>
  );
}
