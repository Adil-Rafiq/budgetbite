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
 *
 * `itemPrice` is a *delivered* cost, not a menu figure — pass it through
 * `estimateMealCost` (single dish) or `typicalMealCost` (whole restaurant)
 * below so delivery fees and minimum-order floors are already counted.
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

/**
 * What a meal actually costs to receive, not what the menu says.
 *
 * A menu price is never the price. Foodpanda adds a delivery fee, and a
 * minimum-order floor means a cheap item on its own cannot be ordered at all —
 * you either pad the basket up to the floor or you don't eat. Both numbers are
 * already displayed beside the fit badge, so treating them as decoration is how
 * a ₨24 roti from a vendor with a ₨249 minimum and a ₨199 fee got badged "fits"
 * against a ₨150 per-meal target when the real damage is ₨448.
 *
 * Prices remain best-effort estimates; this only stops the estimate from being
 * knowingly lower than the floor the user will actually hit.
 */
export function estimateMealCost({
  itemPrice,
  deliveryFee,
  minimumOrder,
}: {
  itemPrice: number;
  deliveryFee?: number | null;
  minimumOrder?: number | null;
}): number {
  return Math.max(itemPrice, minimumOrder ?? 0) + (deliveryFee ?? 0);
}

/**
 * The price a whole restaurant should be judged on in a list.
 *
 * `minItemPrice` is the cheapest thing on the menu — a naan, a raita, a soft
 * drink. Badging or ranking a restaurant by it tells a user with ₨150 a meal
 * that a place whose median dish is ₨850 "fits their budget", which was true
 * of 43 of 44 seeded restaurants. The average is what someone actually ends up
 * paying, so the average (floored by the minimum order, plus delivery) is what
 * both the badge and the "Best for budget" sort read.
 *
 * Returns null when the restaurant has no menu yet — the caller should say so
 * rather than imply a price it does not have.
 */
export function typicalMealCost({
  avgItemPrice,
  minItemPrice,
  deliveryFee,
  minimumOrder,
}: {
  avgItemPrice?: number | null;
  minItemPrice?: number | null;
  deliveryFee?: number | null;
  minimumOrder?: number | null;
}): number | null {
  const base = avgItemPrice ?? minItemPrice;
  if (base == null) return null;
  return estimateMealCost({ itemPrice: base, deliveryFee, minimumOrder });
}
