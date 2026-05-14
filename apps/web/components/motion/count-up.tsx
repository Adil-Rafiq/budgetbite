'use client';

import { animate, useInView, useMotionValue, useTransform, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({
  value,
  duration = 1.0,
  decimals = 0,
  prefix,
  suffix,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    const fixed = latest.toFixed(decimals);
    const withSeparators = Number(fixed).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${prefix ?? ''}${withSeparators}${suffix ?? ''}`;
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [count, value, duration, inView]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
