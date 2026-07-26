'use client';

import { motion, useReducedMotion } from 'motion/react';
import { isAlarming, type SpendingHealth } from '@/lib/budget-plan/spending-health';

/**
 * Share-of-budget spent.
 *
 * Three things the plans surface's hand-rolled bars got wrong. They were plain
 * `div`s with no `role="progressbar"` and no `aria-valuenow`, so the single
 * most important progress signal in the product reached a screen-reader user as
 * nothing at all — while the dashboard's equivalent was announced correctly.
 * They animated width unconditionally, ignoring `prefers-reduced-motion` (the
 * CSS block in globals.css cannot reach Framer). And they clamped the fill at
 * 100%, so 150% spent looked identical to 90%.
 *
 * Overspend now reads as overspend: the track fills completely and carries a
 * hatched overflow band, so "past the end" is visible rather than implied.
 */
export function BudgetProgress({
  spentPercent,
  health,
  className = '',
  label = 'Share of budget spent',
}: {
  spentPercent: number;
  health: SpendingHealth;
  className?: string;
  label?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const alarm = isAlarming(health);
  const isOver = health === 'over' || spentPercent > 100;
  const fillWidth = Math.min(100, Math.max(0, spentPercent));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(spentPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-sage/50 ${className}`}
    >
      <motion.div
        className={`h-full rounded-full ${alarm ? 'bg-tomato' : 'bg-green'}`}
        style={
          isOver
            ? {
                // Hatching marks the part of the period that was funded by
                // money the budget did not have.
                backgroundImage:
                  'repeating-linear-gradient(135deg, rgba(255,255,255,0.45) 0 4px, transparent 4px 8px)',
              }
            : undefined
        }
        initial={prefersReducedMotion ? false : { width: '0%' }}
        animate={{ width: `${fillWidth}%` }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }
        }
      />
    </div>
  );
}
