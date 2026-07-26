/**
 * Canonical plan-period arithmetic, shared by the API and the web app.
 *
 * The web app previews "≈ ₨X per meal" while the user is still setting a
 * budget; the API computes the same figure when it creates the plan. Those two
 * numbers are shown to the user seconds apart, so they have to come from one
 * implementation — a locally-reasonable `days: 7` on one side and an inclusive
 * day count on the other produced a ~12% drift between the last onboarding
 * screen and the first dashboard screen.
 *
 * Product principle 5 ("Honest money UI") makes that a correctness bug, not a
 * rounding detail. Everything here is pure and dependency-free so both sides
 * can import it and it can be unit-tested without a database.
 */

export type PlanType = 'weekly' | 'monthly';

/** Formats a Date as a local-time YYYY-MM-DD string (never UTC-shifted). */
export function toPlanDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Whole calendar days covered by a plan, counting **both** endpoints — a plan
 * running 2026-07-06 → 2026-07-12 covers 7 days, not 6. Clamped to at least 1
 * so a same-day (or inverted/malformed) range never yields zero meals.
 */
export function inclusiveDayCount(startDate: string, endDate: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.max(1, Math.round((end - start) / msPerDay) + 1);
}

/** Total meal slots in a plan: mealsPerDay × inclusive day count. */
export function totalMealsForPlan(input: {
  mealsPerDay: number;
  startDate: string;
  endDate: string;
}): number {
  return input.mealsPerDay * inclusiveDayCount(input.startDate, input.endDate);
}

/**
 * The date range a newly created plan covers, starting today.
 *
 * Weekly adds 7 days and monthly adds 1 calendar month to the *end* date, so
 * the inclusive span is 8 days / 31–32 days respectively. That asymmetry is
 * exactly what `inclusiveDayCount` exists to keep both sides honest about.
 */
export function planDateRange(planType: PlanType, from: Date = new Date()) {
  const startDate = new Date(from);
  const endDate = new Date(startDate);

  if (planType === 'weekly') {
    endDate.setDate(endDate.getDate() + 7);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return {
    startDate: toPlanDateString(startDate),
    endDate: toPlanDateString(endDate),
  };
}

export interface PlanBudgetBreakdown {
  startDate: string;
  endDate: string;
  /** Inclusive day count — the same divisor the API uses. */
  days: number;
  totalMeals: number;
  /** Budget available per day across the whole period. */
  perDay: number;
  /** Budget available per meal slot. 0 when no meals are selected. */
  perMeal: number;
}

/**
 * The full per-meal / per-day picture for a prospective plan. This is what the
 * budget step and the review step preview, and it resolves to the same numbers
 * the API will store, because it uses the same range and the same day count.
 */
export function planBudgetBreakdown(input: {
  planType: PlanType;
  totalBudget: number;
  mealsPerDay: number;
  from?: Date;
}): PlanBudgetBreakdown {
  const { startDate, endDate } = planDateRange(input.planType, input.from);
  const days = inclusiveDayCount(startDate, endDate);
  const totalMeals = input.mealsPerDay * days;
  const budget = Number.isFinite(input.totalBudget) ? input.totalBudget : 0;

  return {
    startDate,
    endDate,
    days,
    totalMeals,
    perDay: days > 0 ? budget / days : 0,
    perMeal: totalMeals > 0 ? budget / totalMeals : 0,
  };
}

/**
 * Converts a budget amount when the user switches plan type, preserving their
 * intent rather than silently reinterpreting ₨45,000/month as ₨45,000/week.
 * Scales by the ratio of the two periods' inclusive day counts and rounds to a
 * clean increment so the result still looks like a number a person would pick.
 */
export function convertBudgetForPlanType(
  amount: number,
  from: PlanType,
  to: PlanType,
  roundTo = 500,
): number {
  if (from === to || !Number.isFinite(amount) || amount <= 0) return amount;

  const daysFor = (planType: PlanType) => {
    const { startDate, endDate } = planDateRange(planType);
    return inclusiveDayCount(startDate, endDate);
  };

  const scaled = (amount / daysFor(from)) * daysFor(to);
  return Math.max(roundTo, Math.round(scaled / roundTo) * roundTo);
}
