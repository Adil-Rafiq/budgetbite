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
 * Parse a `YYYY-MM-DD` plan date as local midnight.
 *
 * `new Date('2026-08-05')` is parsed as UTC midnight by spec, which in Pakistan
 * (UTC+5) is 5 AM on the 5th — so any day arithmetic built on it is off by one
 * for the first five hours of every local day. Passing the parts separately
 * gets local midnight, which is what a plan's start/end date actually means.
 */
function parseLocalDate(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole calendar days from `from` to `to`, ignoring clock time. */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/**
 * Days left in a plan period — whole days *after* today, floored at 0.
 *
 * This is the convention the dashboard budget card and the plans list already
 * used, so it is the one every surface uses now. It matters that there is only
 * one: the sidebar briefly counted today as a day left while the dashboard card
 * did not, and the two sat in the same viewport saying "4 days left" and "Days
 * left 3" about the same plan. A product whose fifth principle is that figures
 * must not drift cannot afford two answers to "how long do I have".
 *
 * Null when the date cannot be parsed, so callers omit the fact rather than
 * print a wrong one.
 */
export function daysRemainingInPeriod(endDate: string, today: Date = new Date()): number | null {
  const end = parseLocalDate(endDate);
  if (!end) return null;
  return Math.max(0, calendarDaysBetween(today, end));
}

/**
 * How far through the period we are, 0–1, for comparing pace of spend against
 * pace of time. Null when either date is unparseable or the range is degenerate.
 */
export function periodElapsedFraction(
  startDate: string,
  endDate: string,
  today: Date = new Date(),
): number | null {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return null;
  const totalDays = calendarDaysBetween(start, end) + 1;
  if (totalDays <= 0) return null;
  const elapsedDays = calendarDaysBetween(start, today) + 1;
  return Math.min(1, Math.max(0, elapsedDays / totalDays));
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
