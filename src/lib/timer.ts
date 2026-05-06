import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Rest timer hook. Counts down in seconds. When it reaches 0:
 *   - Vibrates phone (pattern)
 *   - Plays a beep via WebAudio
 *   - Calls onComplete callback
 */
export interface RestTimerState {
  remaining: number;
  total: number;
  isRunning: boolean;
  isFinished: boolean;
}

export interface UseRestTimerOpts {
  onComplete?: () => void;
  vibrate?: boolean;
  sound?: boolean;
}

export function useRestTimer(opts: UseRestTimerOpts = {}) {
  const { onComplete, vibrate = true, sound = true } = opts;
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const stopInterval = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = useCallback((seconds: number) => {
    setTotal(seconds);
    setRemaining(seconds);
    setIsRunning(true);
    completedRef.current = false;
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => {
    if (remaining > 0) setIsRunning(true);
  }, [remaining]);

  const reset = useCallback(() => {
    stopInterval();
    setIsRunning(false);
    setRemaining(0);
    setTotal(0);
    completedRef.current = false;
  }, []);

  const skip = useCallback(() => {
    stopInterval();
    setIsRunning(false);
    setRemaining(0);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          stopInterval();
          setIsRunning(false);
          if (!completedRef.current) {
            completedRef.current = true;
            if (vibrate) safeVibrate([200, 100, 200, 100, 400]);
            if (sound) safeBeep();
            onComplete?.();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000) as unknown as number;
    return stopInterval;
  }, [isRunning, vibrate, sound, onComplete]);

  return {
    state: {
      remaining,
      total,
      isRunning,
      isFinished: total > 0 && remaining === 0,
    } as RestTimerState,
    start,
    pause,
    resume,
    reset,
    skip,
  };
}

function safeVibrate(pattern: number[]) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* no-op */
  }
}

let audioCtx: AudioContext | null = null;

function safeBeep() {
  try {
    type AudioCtxCtor = typeof AudioContext;
    const Ctor: AudioCtxCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const beep = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    };
    beep(880, 0, 0.18);
    beep(880, 0.25, 0.18);
    beep(1320, 0.5, 0.35);
  } catch {
    /* no-op */
  }
}

/** Format seconds as M:SS */
export function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
