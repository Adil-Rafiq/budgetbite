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
/**
 * Pseudo-samples of a neutral 1.0 ratio blended into the learned average, so
 * one or two logged meals barely move the estimate and the padding only
 * becomes assertive once several choices agree.
 */
export const PRICE_PADDING_PRIOR_SAMPLES = 3;

/** Hard ceiling on padding: never inflate a listed price by more than 35%. */
export const MAX_PRICE_PADDING_FACTOR = 1.35;

/**
 * Multiplier to apply to a restaurant's listed menu prices before showing
 * them to the meal-planner LLM, learned from the gap between suggested prices
 * and what users actually logged (taxes, fees, stale scraped prices).
 *
 * Shrinks toward 1.0 for small sample counts and never goes below 1.0 —
 * users paying *less* than listed is headroom we don't bank on, because
 * under-estimating a meal breaks the budget while over-estimating just
 * leaves slack.
 */
export function pricePaddingFactor(
  stats: { avgPaidToEstimatedRatio: number; sampleCount: number } | undefined,
): number {
  if (!stats || stats.sampleCount <= 0) return 1;
  const { avgPaidToEstimatedRatio: ratio, sampleCount } = stats;
  if (!Number.isFinite(ratio) || ratio <= 1) return 1;
  const weight = sampleCount / (sampleCount + PRICE_PADDING_PRIOR_SAMPLES);
  return Math.min(MAX_PRICE_PADDING_FACTOR, 1 + weight * (ratio - 1));
}

/** Apply a padding factor to a listed price, rounding to whole PKR. */
export function padPrice(listedPrice: number, factor: number): number {
  return Math.round(listedPrice * factor);
}

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
