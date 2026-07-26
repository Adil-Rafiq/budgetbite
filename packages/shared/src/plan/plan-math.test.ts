import { describe, expect, it } from 'vitest';

import {
  convertBudgetForPlanType,
  inclusiveDayCount,
  planBudgetBreakdown,
  planDateRange,
  toPlanDateString,
  totalMealsForPlan,
} from './plan-math.js';

describe('inclusiveDayCount', () => {
  it('counts both endpoints', () => {
    expect(inclusiveDayCount('2026-07-06', '2026-07-12')).toBe(7);
  });

  it('treats a same-day range as one day', () => {
    expect(inclusiveDayCount('2026-07-06', '2026-07-06')).toBe(1);
  });

  it('clamps an inverted range to one day rather than going negative', () => {
    expect(inclusiveDayCount('2026-07-12', '2026-07-06')).toBe(1);
  });

  it('spans month boundaries', () => {
    expect(inclusiveDayCount('2026-07-15', '2026-08-14')).toBe(31);
  });
});

describe('totalMealsForPlan', () => {
  it('multiplies meals per day by the inclusive day count', () => {
    expect(
      totalMealsForPlan({ mealsPerDay: 3, startDate: '2026-07-06', endDate: '2026-07-12' }),
    ).toBe(21);
  });
});

describe('planDateRange', () => {
  it('adds 7 days for a weekly plan, giving an 8-day inclusive span', () => {
    const { startDate, endDate } = planDateRange('weekly', new Date(2026, 6, 6));
    expect(startDate).toBe('2026-07-06');
    expect(endDate).toBe('2026-07-13');
    expect(inclusiveDayCount(startDate, endDate)).toBe(8);
  });

  it('adds 1 calendar month for a monthly plan', () => {
    const { startDate, endDate } = planDateRange('monthly', new Date(2026, 6, 15));
    expect(startDate).toBe('2026-07-15');
    expect(endDate).toBe('2026-08-15');
    expect(inclusiveDayCount(startDate, endDate)).toBe(32);
  });

  it('formats dates in local time, not UTC', () => {
    // 00:30 local on the 6th must not report the 5th via a UTC shift.
    expect(toPlanDateString(new Date(2026, 6, 6, 0, 30))).toBe('2026-07-06');
  });
});

describe('planBudgetBreakdown', () => {
  it('divides by the same inclusive day count the API uses', () => {
    const breakdown = planBudgetBreakdown({
      planType: 'weekly',
      totalBudget: 7500,
      mealsPerDay: 3,
      from: new Date(2026, 6, 6),
    });

    // 8 inclusive days × 3 meals = 24 slots. The pre-fix web preview divided by
    // 7 days and reported ~₨357/meal against the API's ₨312.
    expect(breakdown.days).toBe(8);
    expect(breakdown.totalMeals).toBe(24);
    expect(breakdown.perMeal).toBeCloseTo(312.5, 4);
    expect(breakdown.perDay).toBeCloseTo(937.5, 4);
  });

  it('agrees with totalMealsForPlan over the same range', () => {
    const breakdown = planBudgetBreakdown({
      planType: 'monthly',
      totalBudget: 45000,
      mealsPerDay: 2,
      from: new Date(2026, 6, 15),
    });

    expect(breakdown.totalMeals).toBe(
      totalMealsForPlan({
        mealsPerDay: 2,
        startDate: breakdown.startDate,
        endDate: breakdown.endDate,
      }),
    );
  });

  it('reports zero per-meal when no meals are selected', () => {
    const breakdown = planBudgetBreakdown({
      planType: 'weekly',
      totalBudget: 7500,
      mealsPerDay: 0,
    });
    expect(breakdown.perMeal).toBe(0);
  });

  it('treats a non-finite budget as zero rather than propagating NaN', () => {
    const breakdown = planBudgetBreakdown({
      planType: 'weekly',
      totalBudget: Number.NaN,
      mealsPerDay: 3,
    });
    expect(breakdown.perMeal).toBe(0);
  });
});

describe('convertBudgetForPlanType', () => {
  it('scales a weekly budget up when switching to monthly', () => {
    // 8-day week → ~31-day month, so roughly 4x, rounded to the nearest 500.
    const converted = convertBudgetForPlanType(10000, 'weekly', 'monthly');
    expect(converted).toBeGreaterThan(35000);
    expect(converted % 500).toBe(0);
  });

  it('scales a monthly budget down when switching to weekly', () => {
    const converted = convertBudgetForPlanType(45000, 'monthly', 'weekly');
    expect(converted).toBeLessThan(15000);
    expect(converted % 500).toBe(0);
  });

  it('is a no-op when the plan type is unchanged', () => {
    expect(convertBudgetForPlanType(45000, 'monthly', 'monthly')).toBe(45000);
  });

  it('leaves non-positive amounts alone', () => {
    expect(convertBudgetForPlanType(0, 'weekly', 'monthly')).toBe(0);
  });
});
