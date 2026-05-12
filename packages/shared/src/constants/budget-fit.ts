/**
 * Budget-fit thresholds for the per-menu-item indicator on the restaurants UI.
 * Compared against `avgBudgetPerRemainingMeal` (pin-adjusted) returned by
 * GET /api/budget-plans/active.
 *
 *   item.price <= target * FIT_GREEN_RATIO   → green ("fits")
 *   item.price <= target * FIT_AMBER_RATIO   → amber ("tight")
 *   item.price >  target * FIT_AMBER_RATIO   → red   ("over")
 *
 * Red also wins unconditionally when item.price > amountRemaining (the user
 * literally can't afford this item without breaking the plan), regardless of
 * the per-meal target.
 *
 * Lives in @repo/shared so both server-side sort logic ("Best for budget") and
 * client-side badge rendering use the same numbers.
 */
export const FIT_GREEN_RATIO = 1.0;
export const FIT_AMBER_RATIO = 1.3;

export type BudgetFit = 'green' | 'amber' | 'red';

export function classifyBudgetFit({
  itemPrice,
  avgBudgetPerRemainingMeal,
  amountRemaining,
}: {
  itemPrice: number;
  avgBudgetPerRemainingMeal: number;
  amountRemaining: number;
}): BudgetFit {
  if (itemPrice > amountRemaining) return 'red';
  if (itemPrice > avgBudgetPerRemainingMeal * FIT_AMBER_RATIO) return 'red';
  if (itemPrice > avgBudgetPerRemainingMeal * FIT_GREEN_RATIO) return 'amber';
  return 'green';
}
