import { describe, expect, it } from 'vitest';

import {
  classifyBudgetFit,
  estimateMealCost,
  typicalMealCost,
  FIT_AMBER_RATIO,
} from './budget-fit.js';

describe('estimateMealCost', () => {
  it('adds the delivery fee to the menu price', () => {
    expect(estimateMealCost({ itemPrice: 400, deliveryFee: 199, minimumOrder: null })).toBe(599);
  });

  it('floors the price at the minimum order', () => {
    // A ₨24 roti cannot be ordered alone from a vendor with a ₨249 floor.
    expect(estimateMealCost({ itemPrice: 24, deliveryFee: 199, minimumOrder: 249 })).toBe(448);
  });

  it('ignores a minimum order the item already clears', () => {
    expect(estimateMealCost({ itemPrice: 900, deliveryFee: 0, minimumOrder: 249 })).toBe(900);
  });

  it('treats missing fees and floors as zero rather than unknown', () => {
    expect(estimateMealCost({ itemPrice: 300 })).toBe(300);
    expect(estimateMealCost({ itemPrice: 300, deliveryFee: null, minimumOrder: null })).toBe(300);
  });
});

describe('typicalMealCost', () => {
  it('judges a restaurant on its average dish, not its cheapest', () => {
    // The real shape of the seeded data that made this necessary: a menu whose
    // floor is a side dish and whose average is a meal.
    expect(
      typicalMealCost({ avgItemPrice: 1076, minItemPrice: 24, deliveryFee: 199, minimumOrder: 249 }),
    ).toBe(1275);
  });

  it('falls back to the cheapest item when there is no average', () => {
    expect(
      typicalMealCost({ avgItemPrice: null, minItemPrice: 500, deliveryFee: 50, minimumOrder: null }),
    ).toBe(550);
  });

  it('returns null when the restaurant has no menu', () => {
    expect(typicalMealCost({ avgItemPrice: null, minItemPrice: null, deliveryFee: 199 })).toBeNull();
    expect(typicalMealCost({})).toBeNull();
  });

  it('still applies the minimum-order floor to the average', () => {
    expect(
      typicalMealCost({ avgItemPrice: 100, minItemPrice: 40, deliveryFee: 0, minimumOrder: 500 }),
    ).toBe(500);
  });
});

describe('classifyBudgetFit over a delivered cost', () => {
  const budget = { avgBudgetPerRemainingMeal: 150, amountRemaining: 900 };

  it('no longer calls a cheap side dish a fitting meal', () => {
    // The regression this whole change exists for: menu floor said "fits",
    // delivered cost says "over".
    const menuFloor = 24;
    expect(classifyBudgetFit({ itemPrice: menuFloor, ...budget })).toBe('green');

    const delivered = estimateMealCost({
      itemPrice: menuFloor,
      deliveryFee: 199,
      minimumOrder: 249,
    });
    expect(classifyBudgetFit({ itemPrice: delivered, ...budget })).toBe('red');
  });

  it('keeps a genuinely affordable delivered meal green', () => {
    const delivered = estimateMealCost({ itemPrice: 100, deliveryFee: 50, minimumOrder: null });
    expect(classifyBudgetFit({ itemPrice: delivered, ...budget })).toBe('green');
  });

  it('marks the band between the target and the amber ratio as tight', () => {
    const delivered = estimateMealCost({ itemPrice: 160, deliveryFee: 0, minimumOrder: null });
    expect(delivered).toBeGreaterThan(budget.avgBudgetPerRemainingMeal);
    expect(delivered).toBeLessThanOrEqual(budget.avgBudgetPerRemainingMeal * FIT_AMBER_RATIO);
    expect(classifyBudgetFit({ itemPrice: delivered, ...budget })).toBe('amber');
  });

  it('is red once the delivered cost exceeds what is actually left', () => {
    const delivered = estimateMealCost({ itemPrice: 800, deliveryFee: 199, minimumOrder: null });
    expect(delivered).toBeGreaterThan(budget.amountRemaining);
    expect(classifyBudgetFit({ itemPrice: delivered, ...budget })).toBe('red');
  });
});
