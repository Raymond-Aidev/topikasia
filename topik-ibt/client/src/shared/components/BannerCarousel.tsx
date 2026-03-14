/**
 * 배너 캐러셀 컴포넌트
 * 외부 라이브러리 없이 useState + useEffect 기반 구현
 */
import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  bgGradient: string;
  ctaText?: string;
  ctaLink?: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  height?: number;
  autoInterval?: number;
  onCtaClick?: (link: string) => void;
}

export default function BannerCarousel({
  slides,
  height = 300,
  autoInterval = 5000,
  onCtaClick,
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      setCurrentIndex(((idx % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const id = setInterval(goNext, autoInterval);
    return () => clearInterval(id);
  }, [isPaused, goNext, autoInterval, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ height }}>
      {/* Track */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="min-w-full flex flex-col justify-center px-12 py-10 box-border text-white"
            style={{ background: slide.bgGradient, height }}
          >
            <div className="text-[26px] font-extrabold mb-3 leading-tight">{slide.title}</div>
            <div className="text-[15px] opacity-90 leading-relaxed mb-5">{slide.subtitle}</div>
            {slide.ctaText && (
              <Button
                variant="outline"
                className="self-start rounded-full bg-white text-accent border-none font-bold px-7 hover:bg-white/90"
                onClick={() => onCtaClick?.(slide.ctaLink || '/')}
              >
                {slide.ctaText}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            className="absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 text-white border-none cursor-pointer flex items-center justify-center z-[2] text-base hover:bg-black/40"
            onClick={goPrev}
            aria-label="이전 배너"
          >
            &#10094;
          </button>
          <button
            className="absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 text-white border-none cursor-pointer flex items-center justify-center z-[2] text-base hover:bg-black/40"
            onClick={goNext}
            aria-label="다음 배너"
          >
            &#10095;
          </button>
        </>
      )}

      {/* Dots + Pause */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[2]">
        {slides.map((_, i) => (
          <button
            key={i}
            className={cn(
              "w-2 h-2 rounded-full border-none cursor-pointer p-0",
              i === currentIndex ? "bg-white" : "bg-white/40"
            )}
            onClick={() => goTo(i)}
            aria-label={`배너 ${i + 1}`}
          />
        ))}
        <button
          className="w-6 h-6 rounded-full bg-black/30 text-white border-none cursor-pointer text-[11px] flex items-center justify-center ml-1"
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? '자동 재생' : '일시 정지'}
        >
          {isPaused ? '\u25B6' : '\u23F8'}
        </button>
      </div>
    </div>
  );
}
