import { formatPKR } from '@/lib/currency';

export interface LogBudget {
  avgPerMeal: number;
  amountRemaining: number;
  hasBudget: boolean;
}

/**
 * Soft guardrail on the one number the whole product trusts.
 *
 * Names the overage when a typed amount clearly blows the budget, so a
 * fat-fingered value can't silently re-plan the rest of the period. Non-blocking
 * by design — the user can still log an over-budget meal, because eating out
 * happens; they just can't do it without seeing it.
 *
 * This lives here rather than inside the dashboard's log modal because the
 * restaurants surface needs the identical guard and had a weaker one: it warned
 * only at 2× the per-meal target and never mentioned the remaining balance. The
 * surface where a user is most likely to be looking at something they cannot
 * afford had the more forgiving check, which is exactly backwards.
 */
export function amountWarning(
  amount: number | undefined,
  budget: LogBudget | undefined,
): string | null {
  if (!budget || !amount || amount <= 0) return null;
  if (budget.amountRemaining > 0 && amount > budget.amountRemaining) {
    return `That's ${formatPKR(amount - budget.amountRemaining)} more than the ${formatPKR(
      budget.amountRemaining,
    )} you have left. Double-check the amount.`;
  }
  if (budget.avgPerMeal > 0 && amount > budget.avgPerMeal * 1.3) {
    return `That's well over your per-meal budget of about ${formatPKR(
      budget.avgPerMeal,
    )}. Double-check the amount.`;
  }
  return null;
}
