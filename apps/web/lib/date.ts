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
