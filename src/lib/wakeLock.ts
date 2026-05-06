import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Screen Wake Lock hook. Keeps the screen on while the page is visible.
 * Auto-reacquires the lock when the page returns to foreground (Safari drops
 * it on tab switch). Caller controls enable/disable.
 */
export function useWakeLock(enabled: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const [active, setActive] = useState(false);

  const acquire = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    if (document.visibilityState !== "visible") return;
    try {
      lockRef.current = await navigator.wakeLock.request("screen");
      setActive(true);
      lockRef.current.addEventListener("release", () => setActive(false));
    } catch {
      setActive(false);
    }
  }, []);

  const release = useCallback(async () => {
    try {
      await lockRef.current?.release();
    } catch {
      /* no-op */
    }
    lockRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      void acquire();
    } else {
      void release();
    }
    return () => {
      void release();
    };
  }, [enabled, acquire, release]);

  useEffect(() => {
    if (!enabled) return;
    const onVis = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled, acquire]);

  return { active, supported: typeof navigator !== "undefined" && "wakeLock" in navigator };
}
