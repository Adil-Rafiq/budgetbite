import type { BudgetStateContext } from '@repo/shared';
import { describe, expect, it } from 'vitest';

import {
  MAX_PRICE_PADDING_FACTOR,
  applyPinAdjustment,
  daysRemaining,
  isOnBudgetPace,
  padPrice,
  pricePaddingFactor,
  totalMealsForPlan,
} from './plan-math.js';

describe('totalMealsForPlan', () => {
  it('counts days inclusively: a 7-day weekly plan at 3 meals/day has 21 meals', () => {
    expect(
      totalMealsForPlan({ mealsPerDay: 3, startDate: '2026-07-06', endDate: '2026-07-12' }),
    ).toBe(21);
  });

  it('a single-day plan still counts one full day', () => {
    expect(
      totalMealsForPlan({ mealsPerDay: 2, startDate: '2026-07-06', endDate: '2026-07-06' }),
    ).toBe(2);
  });

  it('spans month boundaries: a 28-day February plan at 2 meals/day has 56 meals', () => {
    expect(
      totalMealsForPlan({ mealsPerDay: 2, startDate: '2026-02-01', endDate: '2026-02-28' }),
    ).toBe(56);
  });

  it('handles a 31-day monthly plan crossing into the next month', () => {
    expect(
      totalMealsForPlan({ mealsPerDay: 3, startDate: '2026-07-15', endDate: '2026-08-14' }),
    ).toBe(93);
  });

  it('clamps an inverted date range to one day instead of going negative', () => {
    expect(
      totalMealsForPlan({ mealsPerDay: 3, startDate: '2026-07-12', endDate: '2026-07-06' }),
    ).toBe(3);
  });
});

function rawBudget(overrides: Partial<BudgetStateContext> = {}): BudgetStateContext {
  return {
    totalBudget: 10000,
    amountSpent: 2000,
    amountRemaining: 8000,
    totalMeals: 21,
    mealsConsumed: 5,
    mealsRemaining: 16,
    avgBudgetPerRemainingMeal: 500,
    cumulativeVariance: -150,
    ...overrides,
  };
}

describe('applyPinAdjustment', () => {
  it('subtracts pinned spend and pinned slots, then re-derives the per-meal average', () => {
    const adjusted = applyPinAdjustment(rawBudget(), 1200, 2);
    expect(adjusted.amountRemaining).toBe(6800);
    expect(adjusted.mealsRemaining).toBe(14);
    expect(adjusted.avgBudgetPerRemainingMeal).toBeCloseTo(6800 / 14, 10);
  });

  it('leaves choice-driven fields untouched', () => {
    const adjusted = applyPinAdjustment(rawBudget(), 1200, 2);
    expect(adjusted.totalBudget).toBe(10000);
    expect(adjusted.amountSpent).toBe(2000);
    expect(adjusted.totalMeals).toBe(21);
    expect(adjusted.mealsConsumed).toBe(5);
    expect(adjusted.cumulativeVariance).toBe(-150);
  });

  it('is a no-op when nothing is pinned', () => {
    expect(applyPinAdjustment(rawBudget(), 0, 0)).toEqual(rawBudget());
  });

  it('clamps at zero when pins exceed the remaining budget', () => {
    const adjusted = applyPinAdjustment(rawBudget(), 9000, 3);
    expect(adjusted.amountRemaining).toBe(0);
    expect(adjusted.mealsRemaining).toBe(13);
    expect(adjusted.avgBudgetPerRemainingMeal).toBe(0);
  });

  it('reports a zero average (not Infinity/NaN) when every remaining meal is pinned', () => {
    const adjusted = applyPinAdjustment(rawBudget(), 4000, 16);
    expect(adjusted.mealsRemaining).toBe(0);
    expect(adjusted.avgBudgetPerRemainingMeal).toBe(0);
  });

  it('does not mutate the input state', () => {
    const raw = rawBudget();
    applyPinAdjustment(raw, 1200, 2);
    expect(raw).toEqual(rawBudget());
  });
});

describe('pricePaddingFactor', () => {
  it('returns 1 when there is no signal', () => {
    expect(pricePaddingFactor(undefined)).toBe(1);
    expect(pricePaddingFactor({ avgPaidToEstimatedRatio: 1.2, sampleCount: 0 })).toBe(1);
  });

  it('never discounts: a paid-less-than-listed ratio still yields 1', () => {
    expect(pricePaddingFactor({ avgPaidToEstimatedRatio: 0.8, sampleCount: 20 })).toBe(1);
    expect(pricePaddingFactor({ avgPaidToEstimatedRatio: 1.0, sampleCount: 20 })).toBe(1);
  });

  it('shrinks toward 1 with few samples', () => {
    // weight = 1 / (1 + 3) = 0.25, so a 20% observed gap pads only 5%
    expect(pricePaddingFactor({ avgPaidToEstimatedRatio: 1.2, sampleCount: 1 })).toBeCloseTo(
      1.05,
      10,
    );
  });

  it('approaches the observed ratio as samples accumulate', () => {
    // weight = 27 / 30 = 0.9, so a 20% gap pads 18%
    expect(pricePaddingFactor({ avgPaidToEstimatedRatio: 1.2, sampleCount: 27 })).toBeCloseTo(
      1.18,
      10,
    );
  });

  it('clamps extreme gaps to the ceiling', () => {
    expect(pricePaddingFactor({ avgPaidToEstimatedRatio: 2.4, sampleCount: 50 })).toBe(
      MAX_PRICE_PADDING_FACTOR,
    );
  });

  it('treats a non-finite ratio as no signal', () => {
    expect(pricePaddingFactor({ avgPaidToEstimatedRatio: NaN, sampleCount: 10 })).toBe(1);
    expect(pricePaddingFactor({ avgPaidToEstimatedRatio: Infinity, sampleCount: 10 })).toBe(1);
  });
});

describe('isOnBudgetPace', () => {
  const base = { startDate: '2026-07-06', endDate: '2026-07-12', today: '2026-07-09' };

  it('is on pace when spend fraction trails elapsed fraction', () => {
    // 3 of 6 days elapsed (~0.5), spent 4000/10000 (0.4)
    expect(isOnBudgetPace({ ...base, totalBudget: 10000, amountSpent: 4000 })).toBe(true);
  });

  it('is off pace when spend outruns the clock beyond tolerance', () => {
    // ~0.5 elapsed, spent 0.8 of budget
    expect(isOnBudgetPace({ ...base, totalBudget: 10000, amountSpent: 8000 })).toBe(false);
  });

  it('allows a small tolerance so slight front-loading still counts as on pace', () => {
    // ~0.5 elapsed, spent 0.54 — within the 5% tolerance
    expect(isOnBudgetPace({ ...base, totalBudget: 10000, amountSpent: 5400 })).toBe(true);
  });

  it('treats overspending a zero budget as off pace instead of dividing by zero', () => {
    expect(isOnBudgetPace({ ...base, totalBudget: 0, amountSpent: 500 })).toBe(false);
    expect(isOnBudgetPace({ ...base, totalBudget: 0, amountSpent: 0 })).toBe(true);
  });

  it('clamps a not-yet-started plan to zero elapsed, so spend past tolerance is off pace', () => {
    // today precedes startDate → elapsed 0; 1000/10000 (0.1) exceeds tolerance
    expect(
      isOnBudgetPace({
        totalBudget: 10000,
        amountSpent: 1000,
        startDate: '2026-07-10',
        endDate: '2026-07-16',
        today: '2026-07-08',
      }),
    ).toBe(false);
    // ...but a trivial pre-spend within tolerance is still fine
    expect(
      isOnBudgetPace({
        totalBudget: 10000,
        amountSpent: 100,
        startDate: '2026-07-10',
        endDate: '2026-07-16',
        today: '2026-07-08',
      }),
    ).toBe(true);
  });

  it('treats a same-day (zero-span) plan as fully elapsed', () => {
    expect(
      isOnBudgetPace({
        totalBudget: 10000,
        amountSpent: 9000,
        startDate: '2026-07-09',
        endDate: '2026-07-09',
        today: '2026-07-09',
      }),
    ).toBe(true);
  });
});

describe('daysRemaining', () => {
  it('counts whole days up to and including the end date', () => {
    expect(daysRemaining('2026-07-09', '2026-07-12')).toBe(3);
  });

  it('is zero on the final day', () => {
    expect(daysRemaining('2026-07-12', '2026-07-12')).toBe(0);
  });

  it('clamps a past end date to zero', () => {
    expect(daysRemaining('2026-07-12', '2026-07-06')).toBe(0);
  });
});

describe('padPrice', () => {
  it('rounds the padded price to whole rupees', () => {
    expect(padPrice(449, 1.12)).toBe(503);
    expect(padPrice(250, 1.1)).toBe(275);
  });

  it('is the identity for a factor of 1 on whole prices', () => {
    expect(padPrice(600, 1)).toBe(600);
  });
});
