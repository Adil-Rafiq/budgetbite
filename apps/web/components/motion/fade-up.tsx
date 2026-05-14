'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

interface FadeUpProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
}

export function FadeUp({ children, delay = 0, duration = 0.45, y = 12, ...rest }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
