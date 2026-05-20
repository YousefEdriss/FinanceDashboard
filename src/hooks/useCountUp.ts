import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState<number>(0);
  const frameRef = useRef<number>(0);
  const prevRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    let startTime: number | null = null;

    const step = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return value;
}
