import { useState, useCallback, useRef } from 'react';

interface UseKoreanCharCountReturn {
  /** The count to display (accounts for IME composition) */
  displayCount: number;
  /** Attach to textarea/input onCompositionStart */
  onCompositionStart: () => void;
  /** Attach to textarea/input onCompositionEnd */
  onCompositionEnd: (e: React.CompositionEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  /** Call this whenever the text value changes */
  updateCount: (text: string) => void;
  /** Whether IME composition is in progress */
  isComposing: boolean;
}

/**
 * Handles Korean character counting with proper IME composition handling.
 * During composition (e.g. ㅎ → 하 → 한), the composing character is counted once.
 */
export function useKoreanCharCount(): UseKoreanCharCountReturn {
  const [displayCount, setDisplayCount] = useState(0);
  const isComposingRef = useRef(false);
  const [isComposing, setIsComposing] = useState(false);

  const updateCount = useCallback((text: string) => {
    // Count characters (spaces included)
    setDisplayCount(text.length);
  }, []);

  const onCompositionStart = useCallback(() => {
    isComposingRef.current = true;
    setIsComposing(true);
  }, []);

  const onCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      isComposingRef.current = false;
      setIsComposing(false);
      // After composition ends, update count from target value
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      setDisplayCount(target.value.length);
    },
    [],
  );

  return {
    displayCount,
    onCompositionStart,
    onCompositionEnd,
    updateCount,
    isComposing,
  };
}
