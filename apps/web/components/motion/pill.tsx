'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { forwardRef } from 'react';

type Variant = 'primary' | 'ghost' | 'filter';

interface PillProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: Variant;
  active?: boolean;
}

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const WHITE = '#ffffff';

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  borderRadius: 999,
  fontWeight: 500,
  transition: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease',
  userSelect: 'none',
};

function styleFor(variant: Variant, active: boolean): React.CSSProperties {
  if (variant === 'primary') {
    return {
      background: VAST,
      color: LUMEN,
      border: `1px solid ${VAST}`,
    };
  }
  if (variant === 'filter') {
    return {
      background: active ? VAST : WHITE,
      color: active ? LUMEN : VAST,
      border: `1px solid ${active ? VAST : LUMEN_DK}`,
      fontFamily: 'var(--font-mono)',
    };
  }
  return {
    background: WHITE,
    color: VAST,
    border: `1px solid ${LUMEN_DK}`,
    fontFamily: 'var(--font-mono)',
  };
}

function hoverFor(variant: Variant, active: boolean) {
  if (variant === 'primary') {
    return {
      background: '#2a2a2a',
      boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
      y: -1,
    };
  }
  if (variant === 'filter' && !active) {
    return {
      background: LUMEN,
      borderColor: '#cfcfb8',
    };
  }
  if (variant === 'ghost') {
    return {
      background: LUMEN,
      borderColor: '#cfcfb8',
    };
  }
  return {};
}

export const Pill = forwardRef<HTMLButtonElement, PillProps>(function Pill(
  { children, variant = 'primary', active = false, style, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileHover={disabled ? undefined : hoverFor(variant, active)}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      style={{
        ...baseStyles,
        ...styleFor(variant, active),
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
