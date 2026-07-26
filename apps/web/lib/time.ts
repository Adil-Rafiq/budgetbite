/**
 * Time-of-day display, defined once.
 *
 * Reminder times are stored and sent as 24-hour `HH:MM` (the API's
 * `timeOfDayStringSchema`), but Pakistan reads clock times in 12-hour form —
 * and the plan preview screen already rendered `8:00 PM` while the picker
 * beside it said `20:00`. Storage format and display format are different
 * concerns; this module owns the second one.
 */

const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

/** `'20:00'` → `'8:00 PM'`. Returns an em dash for unparseable input. */
export function formatTimeOfDay(value: string): string {
  const match = TIME_PATTERN.exec(value);
  if (!match) return '—';

  const hours = Number(match[1]);
  const minutes = match[2]!;
  if (!Number.isFinite(hours) || hours > 23) return '—';

  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${suffix}`;
}

/** `'20'` → `'8 PM'`. Used to label the hour column of the time picker. */
export function formatHourLabel(hh: string): string {
  const hours = Number(hh);
  if (!Number.isFinite(hours) || hours < 0 || hours > 23) return hh;

  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12} ${suffix}`;
}
