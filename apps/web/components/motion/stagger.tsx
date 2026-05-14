'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

interface StaggerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
  stagger?: number;
}

export function Stagger({ children, delay = 0, stagger = 0.06, ...rest }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  y?: number;
}

export function StaggerItem({ children, y = 12, ...rest }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
