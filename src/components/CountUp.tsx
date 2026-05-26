import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Target number to count up to */
  end: number;
  /** Duration of the animation in ms */
  duration?: number;
  /** Prefix string (e.g. "D" for Dalasi) */
  prefix?: string;
  /** Suffix string */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** CSS class for the number */
  className?: string;
  /** Whether to start the animation */
  active?: boolean;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const CountUp = ({
  end,
  duration = 800,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  active = true,
}: CountUpProps) => {
  const [display, setDisplay] = useState(active ? 0 : end);
  const animRef = useRef<number>(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!active || hasRun.current) return;
    hasRun.current = true;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = easedProgress * end;

      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, [active, end, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString();

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

export default CountUp;
