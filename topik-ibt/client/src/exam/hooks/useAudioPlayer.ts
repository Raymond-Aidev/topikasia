import { useEffect, useRef, useState, useCallback } from 'react';
import { Howl } from 'howler';

interface UseAudioPlayerOptions {
  audioUrl: string;
  maxPlays: number;
  questionId: string;
  autoPlay?: boolean;
}

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  progress: number;       // 0–1
  duration: number;       // seconds
  currentTime: number;    // seconds
  playCount: number;
  canPlay: boolean;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
}

export function useAudioPlayer({
  audioUrl,
  maxPlays,
  questionId,
  autoPlay = true,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number>(0);
  const playCountRef = useRef<Record<string, number>>({});

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  const currentQId = useRef(questionId);

  // Initialise play count for this question
  if (!(questionId in playCountRef.current)) {
    playCountRef.current[questionId] = 0;
  }

  const canPlay = playCountRef.current[questionId] < maxPlays;

  // Cleanup helper
  const destroyHowl = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  // Track progress via requestAnimationFrame
  const trackProgress = useCallback(() => {
    const h = howlRef.current;
    if (!h || !h.playing()) return;
    const seek = h.seek() as number;
    const dur = h.duration();
    setCurrentTime(seek);
    setProgress(dur > 0 ? seek / dur : 0);
    rafRef.current = requestAnimationFrame(trackProgress);
  }, []);

  // Create / recreate Howl when question changes
  useEffect(() => {
    // Stop previous audio on question change
    destroyHowl();
    currentQId.current = questionId;

    const count = playCountRef.current[questionId] ?? 0;
    setPlayCount(count);
    setDuration(0);

    if (!audioUrl) return;

    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      preload: true,
      onload: () => {
        setDuration(howl.duration());
      },
      onplay: () => {
        setIsPlaying(true);
        rafRef.current = requestAnimationFrame(trackProgress);
      },
      onpause: () => {
        setIsPlaying(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      },
      onstop: () => {
        setIsPlaying(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      },
      onend: () => {
        setIsPlaying(false);
        setProgress(1);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      },
    });

    howlRef.current = howl;

    // Auto-play if allowed
    if (autoPlay && count < maxPlays) {
      howl.once('load', () => {
        if (currentQId.current === questionId) {
          playCountRef.current[questionId] = count + 1;
          setPlayCount(count + 1);
          howl.play();
        }
      });
      // If already loaded
      if (howl.state() === 'loaded') {
        playCountRef.current[questionId] = count + 1;
        setPlayCount(count + 1);
        howl.play();
      }
    }

    return destroyHowl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, audioUrl]);

  const play = useCallback(() => {
    const h = howlRef.current;
    if (!h) return;
    const count = playCountRef.current[questionId] ?? 0;
    if (count >= maxPlays) return;
    playCountRef.current[questionId] = count + 1;
    setPlayCount(count + 1);
    h.seek(0);
    h.play();
  }, [questionId, maxPlays]);

  const pause = useCallback(() => {
    howlRef.current?.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    const h = howlRef.current;
    if (!h) return;
    if (h.playing()) {
      h.pause();
    } else {
      // If at end, treat as new play
      const seek = h.seek() as number;
      const dur = h.duration();
      if (dur > 0 && seek >= dur - 0.1) {
        play();
      } else {
        h.play();
      }
    }
  }, [play]);

  return {
    isPlaying,
    progress,
    duration,
    currentTime,
    playCount,
    canPlay,
    play,
    pause,
    togglePlayPause,
  };
}
