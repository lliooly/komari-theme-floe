import { useEffect, useRef, useState } from "react";

interface UseAnimatedNumberOptions {
  enabled?: boolean;
  duration?: number;
}

export function useAnimatedNumber(
  value: number,
  { enabled = true, duration = 500 }: UseAnimatedNumberOptions = {}
) {
  const [animatedValue, setAnimatedValue] = useState(value);
  const valueRef = useRef(value);
  const frameRef = useRef<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const canAnimate = enabled && !prefersReducedMotion && duration > 0 && Number.isFinite(value);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener?.("change", updatePreference);

    return () => mediaQuery.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (!enabled) {
      valueRef.current = value;
      return;
    }

    if (!canAnimate) {
      valueRef.current = value;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronize the non-animated value immediately
      setAnimatedValue(value);
      return;
    }

    const startValue = valueRef.current;
    const delta = value - startValue;

    if (!Number.isFinite(startValue) || Math.abs(delta) < 0.1) {
      valueRef.current = value;
      setAnimatedValue(value);
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + delta * easedProgress;

      valueRef.current = nextValue;
      setAnimatedValue(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      frameRef.current = null;
      valueRef.current = value;
      setAnimatedValue(value);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [canAnimate, duration, enabled, value]);

  return canAnimate ? animatedValue : value;
}
