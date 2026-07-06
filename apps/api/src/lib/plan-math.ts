import type { BudgetStateContext } from '@repo/shared';

/**
 * Pure plan-budget arithmetic. Deliberately free of repository/provider
 * imports so it can be unit-tested without a database or LLM configured.
 */

/**
 * Total meal slots in a plan: mealsPerDay × inclusive day count.
 * Dates are YYYY-MM-DD strings; the day count is clamped to at least 1 so a
 * same-day (or malformed) range never yields zero meals.
 */
export function totalMealsForPlan(input: {
  mealsPerDay: number;
  startDate: string;
  endDate: string;
}): number {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1);
  return input.mealsPerDay * days;
}

/**
 * Subtract pinned-slot allocation from raw budget state. plan_context tracks
 * choice-driven spend only — pins are pre-allocations the user has committed
 * to but not yet logged, so for the LLM (and the FE budget-fit indicator) we
 * present a budget that already accounts for them.
 *
 * Adjusted fields: amountRemaining, mealsRemaining, avgBudgetPerRemainingMeal.
 * Untouched: amountSpent, mealsConsumed, totalBudget, totalMeals, cumulativeVariance.
 */
export function applyPinAdjustment(
  raw: BudgetStateContext,
  pinSpend: number,
  pinCount: number,
): BudgetStateContext {
  const amountRemaining = Math.max(0, raw.amountRemaining - pinSpend);
  const mealsRemaining = Math.max(0, raw.mealsRemaining - pinCount);
  const avgBudgetPerRemainingMeal = mealsRemaining > 0 ? amountRemaining / mealsRemaining : 0;
  return {
    ...raw,
    amountRemaining,
    mealsRemaining,
    avgBudgetPerRemainingMeal,
  };
}
