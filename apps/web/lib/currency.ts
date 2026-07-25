/**
 * Single source of truth for how PKR amounts render across the app.
 *
 * BudgetBite's money must read the same everywhere — one currency mark, one
 * grouping — so the number the whole product is about never looks like two
 * different things on two different screens. Prefix mark, en-US thousands
 * grouping, whole rupees (no paisa; spend is tracked to the rupee).
 */
const RUPEE = '₨'; // ₨

export function formatPKR(amount: number): string {
  return `${RUPEE} ${Math.round(amount).toLocaleString('en-US')}`;
}
