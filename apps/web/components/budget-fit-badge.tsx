import type { BudgetFit } from '@repo/shared';

/**
 * Canonical budget-fit pill — one place so the "Fits budget / Tight / Over
 * budget" cue reads identically wherever a price is weighed against the
 * per-meal budget: restaurant menus, the restaurants list, and the dashboard
 * meal decision. Pair with `classifyBudgetFit` from @repo/shared, which decides
 * the tone from the same numbers on client and server — feed it a *delivered*
 * cost (`estimateMealCost` / `typicalMealCost`), not a bare menu price.
 *
 * Every state carries its label as text, so the cue never rests on hue alone.
 * The inks are the readable members of each family: the raw brand hues sat at
 * ~3.3:1 and ~3.9:1 as label colours on these tints, under the AA floor for
 * 10px type. Measured: amber-ink on amber-tint 5.50:1, tomato-ink on tomato/10
 * 5.58:1, green-deep on green/10 4.64:1.
 */
export const BUDGET_FIT_PILL: Record<
  BudgetFit,
  { pill: string; dot: string; text: string; label: string }
> = {
  green: {
    pill: 'bg-green/10 text-green-deep',
    dot: 'bg-green-deep',
    text: 'text-green-deep',
    label: 'Fits budget',
  },
  amber: {
    pill: 'bg-amber-tint text-amber-ink',
    dot: 'bg-amber',
    text: 'text-amber-ink',
    label: 'Tight',
  },
  red: {
    pill: 'bg-tomato/10 text-tomato-ink',
    dot: 'bg-tomato',
    text: 'text-tomato-ink',
    label: 'Over budget',
  },
};

export function BudgetFitBadge({
  fit,
  showDot = false,
  className = '',
}: {
  fit: BudgetFit;
  showDot?: boolean;
  className?: string;
}) {
  const v = BUDGET_FIT_PILL[fit];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${v.pill} ${className}`}
    >
      {showDot && <span className={`inline-block h-1.5 w-1.5 rounded-full ${v.dot}`} />}
      {v.label}
    </span>
  );
}
