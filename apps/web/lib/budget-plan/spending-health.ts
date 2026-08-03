import { formatPKR } from '@/lib/currency';

/**
 * How a plan is tracking against its budget, as one shared judgement.
 *
 * The dashboard already graded spend in three bands and wrote a sentence about
 * it; the plans surface graded it with `spentPercent >= 90 ? red : green`. That
 * single `if` made 89% reassuring, 90% an alarm, and 150% indistinguishable
 * from 90% — on the screen where a whole period is reviewed. One scale now
 * serves both, and "over" is a real band rather than a colour swap.
 */
export type SpendingHealth = 'good' | 'warning' | 'danger' | 'over';

export function getSpendingHealth({
  spent,
  total,
  remaining,
}: {
  spent: number;
  total: number;
  /** Pass the server's figure where one exists; otherwise it is derived. */
  remaining?: number;
}): SpendingHealth {
  const left = remaining ?? total - spent;
  if (left < 0) return 'over';

  const ratio = total > 0 ? spent / total : 0;
  if (ratio < 0.7) return 'good';
  if (ratio < 0.9) return 'warning';
  return 'danger';
}

/** True when the state warrants alarm styling (tomato rather than teal). */
export const isAlarming = (health: SpendingHealth): boolean =>
  health === 'over' || health === 'danger';

/**
 * Plain-language standing, rendered as visible copy rather than a `title`
 * tooltip that never fires on touch and is skipped by screen readers.
 */
export function spendingHealthCaption(health: SpendingHealth, remaining: number): string {
  switch (health) {
    case 'over':
      return `You've spent ${formatPKR(Math.abs(remaining))} more than this period's budget.`;
    case 'danger':
      return "You're spending faster than your budget for the days left — ease off to make it last.";
    case 'warning':
      return "You're a little ahead of your budget for the days left.";
    default:
      return "You're spending in line with your budget for the days left.";
  }
}
