/**
 * Compact count for rating tallies ("1.2k", "3.4m").
 *
 * Shared so the restaurants list and a restaurant's own header don't render the
 * same `ratingCount` two different ways one click apart.
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
