/**
 * Single source of truth for converting Drizzle `numeric` / `decimal` column
 * values (which come back as strings from pg) into JS numbers for API responses.
 * Use in service `toResponse` mappers — never in controllers or repos.
 */

export function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}

export function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === 'number' ? value : Number(value);
}
