'use client';

import {
  animate,
  useInView,
  useMotionValue,
  useTransform,
  useReducedMotion,
  motion,
} from 'motion/react';
import { useEffect, useRef } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /**
   * Custom formatter for the animated value. When provided it takes over
   * rendering entirely (ignoring prefix/suffix/decimals), so callers can route
   * the ticking number through a single source of truth — e.g. `formatPKR`.
   */
  format?: (value: number) => string;
}

export function CountUp({
  value,
  duration = 1.0,
  decimals = 0,
  prefix,
  suffix,
  className,
  format,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (format) return format(latest);
    const fixed = latest.toFixed(decimals);
    const withSeparators = Number(fixed).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${prefix ?? ''}${withSeparators}${suffix ?? ''}`;
  });

  useEffect(() => {
    // The CSS reduced-motion block in globals.css can't reach JS-driven motion,
    // so honor the preference here: snap to the final value, no ticking.
    if (prefersReducedMotion) {
      count.set(value);
      return;
    }
    if (!inView) return;
    const controls = animate(count, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [count, value, duration, inView, prefersReducedMotion]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
