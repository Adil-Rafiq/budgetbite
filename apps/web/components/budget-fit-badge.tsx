import type { BudgetFit } from '@repo/shared';

/**
 * Canonical budget-fit pill — one place so the "Fits budget / Tight / Over
 * budget" cue reads identically wherever a price is weighed against the
 * per-meal budget: restaurant menus, the restaurants list, and the dashboard
 * meal decision. Pair with `classifyBudgetFit` from @repo/shared, which decides
 * the tone from the same numbers on client and server.
 */
export const BUDGET_FIT_PILL: Record<BudgetFit, { pill: string; dot: string; label: string }> = {
  green: { pill: 'bg-green/10 text-dark-green', dot: 'bg-green', label: 'Fits budget' },
  amber: { pill: 'bg-[#fef6e6] text-[#8a5a12]', dot: 'bg-[#f5a623]', label: 'Tight' },
  red: { pill: 'bg-tomato/10 text-tomato', dot: 'bg-tomato', label: 'Over budget' },
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
