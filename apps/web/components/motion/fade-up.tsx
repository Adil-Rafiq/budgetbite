'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

interface FadeUpProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
}

export function FadeUp({ children, delay = 0, duration = 0.45, y = 12, ...rest }: FadeUpProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion ? { duration: 0 } : { duration, delay, ease: [0.22, 1, 0.36, 1] }
      }
      {...rest}
    >
      {children}
    </motion.div>
  );
}
