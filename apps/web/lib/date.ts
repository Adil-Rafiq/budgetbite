/**
 * Today's calendar date (YYYY-MM-DD) in the user's local timezone.
 *
 * Never derive this via `toISOString()` — that renders the UTC date, which
 * lags local time (UTC+5 in Pakistan) and points every read/write at the
 * previous day's slot between midnight and 5 AM.
 */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * "prices updated today" / "prices updated 1 day ago" / "… N days ago" hint
 * for a menu snapshot timestamp. Returns null for missing/unparseable input
 * so callers can just skip rendering.
 */
export function pricesUpdatedAgoLabel(input: Date | string | null | undefined): string | null {
  if (input == null) return null;
  const then = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(then.getTime())) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(0, Math.floor((Date.now() - then.getTime()) / msPerDay));
  if (days === 0) return 'prices updated today';
  return `prices updated ${days} day${days === 1 ? '' : 's'} ago`;
}
