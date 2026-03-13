/**
 * 배너 캐러셀 컴포넌트
 * 외부 라이브러리 없이 useState + useEffect 기반 구현
 */
import { useState, useEffect, useCallback } from 'react';

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

const styles = {
  wrapper: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    borderRadius: 12,
  },
  track: {
    display: 'flex' as const,
    transition: 'transform 0.5s ease-in-out',
  },
  slide: {
    minWidth: '100%',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    justifyContent: 'center' as const,
    padding: '40px 48px',
    boxSizing: 'border-box' as const,
    color: '#FFFFFF',
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: 800 as const,
    marginBottom: 12,
    lineHeight: 1.3,
  },
  slideSubtitle: {
    fontSize: 15,
    opacity: 0.9,
    lineHeight: 1.6,
    marginBottom: 20,
  },
  ctaBtn: {
    display: 'inline-block' as const,
    padding: '10px 28px',
    backgroundColor: '#FFFFFF',
    color: '#1565C0',
    fontSize: 14,
    fontWeight: 700 as const,
    borderRadius: 24,
    border: 'none',
    cursor: 'pointer',
    alignSelf: 'flex-start' as const,
  },
  arrowBtn: {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 2,
  },
  controls: {
    position: 'absolute' as const,
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    zIndex: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  pauseBtn: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 4,
  },
};

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
    <div style={{ ...styles.wrapper, height }}>
      {/* Track */}
      <div
        style={{
          ...styles.track,
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            style={{
              ...styles.slide,
              background: slide.bgGradient,
              height,
            }}
          >
            <div style={styles.slideTitle}>{slide.title}</div>
            <div style={styles.slideSubtitle}>{slide.subtitle}</div>
            {slide.ctaText && (
              <button
                style={styles.ctaBtn}
                onClick={() => onCtaClick?.(slide.ctaLink || '/')}
              >
                {slide.ctaText}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            style={{ ...styles.arrowBtn, left: 12 }}
            onClick={goPrev}
            aria-label="이전 배너"
          >
            &#10094;
          </button>
          <button
            style={{ ...styles.arrowBtn, right: 12 }}
            onClick={goNext}
            aria-label="다음 배너"
          >
            &#10095;
          </button>
        </>
      )}

      {/* Dots + Pause */}
      <div style={styles.controls}>
        {slides.map((_, i) => (
          <button
            key={i}
            style={{
              ...styles.dot,
              backgroundColor: i === currentIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
            }}
            onClick={() => goTo(i)}
            aria-label={`배너 ${i + 1}`}
          />
        ))}
        <button
          style={styles.pauseBtn}
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? '자동 재생' : '일시 정지'}
        >
          {isPaused ? '\u25B6' : '\u23F8'}
        </button>
      </div>
    </div>
  );
}
