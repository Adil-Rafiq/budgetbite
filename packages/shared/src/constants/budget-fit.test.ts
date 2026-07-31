import { describe, expect, it } from 'vitest';

import {
  classifyBudgetFit,
  estimateMealCost,
  maxMenuPriceWithinBudget,
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
      typicalMealCost({
        avgItemPrice: 1076,
        minItemPrice: 24,
        deliveryFee: 199,
        minimumOrder: 249,
      }),
    ).toBe(1275);
  });

  it('falls back to the cheapest item when there is no average', () => {
    expect(
      typicalMealCost({
        avgItemPrice: null,
        minItemPrice: 500,
        deliveryFee: 50,
        minimumOrder: null,
      }),
    ).toBe(550);
  });

  it('returns null when the restaurant has no menu', () => {
    expect(
      typicalMealCost({ avgItemPrice: null, minItemPrice: null, deliveryFee: 199 }),
    ).toBeNull();
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

describe('maxMenuPriceWithinBudget', () => {
  const budget = { avgBudgetPerRemainingMeal: 150, amountRemaining: 900 };

  it('subtracts the delivery fee from the amber ceiling', () => {
    // Ceiling is 150 * 1.3 = 195 delivered; a ₨50 fee leaves ₨145 of menu price.
    expect(maxMenuPriceWithinBudget({ ...budget, deliveryFee: 50, minimumOrder: null })).toBe(145);
  });

  it('uses what is actually left when that bites before the per-meal ceiling', () => {
    // 40 remaining is below 195, so the wallet is the binding constraint.
    expect(
      maxMenuPriceWithinBudget({
        avgBudgetPerRemainingMeal: 150,
        amountRemaining: 40,
        deliveryFee: 10,
        minimumOrder: null,
      }),
    ).toBe(30);
  });

  it('returns null when the fee and floor alone break the ceiling', () => {
    // ₨249 minimum + ₨199 fee = ₨448 delivered before choosing anything, against
    // a ₨195 ceiling. No dish on this menu can come in under budget.
    expect(maxMenuPriceWithinBudget({ ...budget, deliveryFee: 199, minimumOrder: 249 })).toBeNull();
  });

  it('agrees with classifyBudgetFit on both sides of the boundary', () => {
    // The contract the server-side filter relies on: a price at or below the
    // ceiling is never red, and the next rupee up always is.
    const deliveryFee = 50;
    const minimumOrder = 100;
    const ceiling = maxMenuPriceWithinBudget({ ...budget, deliveryFee, minimumOrder });
    if (ceiling === null) throw new Error('expected a ceiling for this fixture');

    const fitAt = (price: number) =>
      classifyBudgetFit({
        itemPrice: estimateMealCost({ itemPrice: price, deliveryFee, minimumOrder }),
        ...budget,
      });

    for (let price = 1; price <= ceiling; price += 1) {
      expect(fitAt(price)).not.toBe('red');
    }
    expect(fitAt(ceiling + 1)).toBe('red');
  });

  it('holds the boundary when nothing is left to spend', () => {
    const ceiling = maxMenuPriceWithinBudget({
      avgBudgetPerRemainingMeal: 150,
      amountRemaining: 0,
      deliveryFee: 0,
      minimumOrder: null,
    });
    // A zero ceiling is a real answer — menu prices are positive, so nothing
    // passes — and it must not be confused with null ("no ceiling computed").
    expect(ceiling).toBe(0);
  });
});
