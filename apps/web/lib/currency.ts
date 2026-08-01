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

/**
 * Compact money, for chart axis ticks only — places the eye scans rather than
 * reads. Every figure a user actually reads goes through `formatPKR`.
 *
 * The analytics axis used to compact with `Math.round(value / 1000) + 'k'`,
 * which printed ₨1,300 as "1k" and ₨3,500 as "4k": a money axis stating
 * amounts that were never spent, in a product whose fifth principle is that
 * displayed amounts must not drift from what was actually spent. Keeping a
 * tenth below ₨10k bounds the label's error at ₨50 instead of ₨500.
 */
export function formatPKRCompact(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const v = Math.abs(amount);
  if (v >= 1_000_000) return `${sign}${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${sign}${Math.round(v / 1000)}k`;
  if (v >= 1_000) return `${sign}${(v / 1000).toFixed(1)}k`;
  return `${sign}${Math.round(v)}`;
}
