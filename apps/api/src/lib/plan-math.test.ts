import type { BudgetStateContext } from '@repo/shared';
import { describe, expect, it } from 'vitest';

import { applyPinAdjustment, totalMealsForPlan } from './plan-math.js';

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
