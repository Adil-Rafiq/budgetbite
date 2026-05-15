import { z } from 'zod';

/**
 * Primitives and envelope helpers shared across every resource schema.
 * Everything in here is resource-agnostic.
 */

export const uuidSchema = z.uuid();

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

/** Envelope factory for list endpoints: `{ data: T[], meta: { total, limit, offset } }`. */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ data: z.array(item), meta: paginationMetaSchema });
}

/** YYYY-MM-DD calendar date as a string. Matches Drizzle `date({ mode: 'string' })`. */
export const isoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

/** HH:MM 24-hour time (used for notificationTimes on budget plans). */
export const timeOfDayStringSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:MM');

/**
 * One per-meal reminder entry stored on `budget_plan.notification_times`.
 * Positional: index N corresponds to the meal_type at sortOrder N for the plan.
 * `enabled: false` means the user has muted that meal's reminder; delivery
 * code should skip it. The time still has to be a valid HH:MM either way so
 * flipping enabled back on doesn't require re-typing.
 */
export const notificationTimeSchema = z.object({
  time: timeOfDayStringSchema,
  enabled: z.boolean(),
});

export type NotificationTime = z.infer<typeof notificationTimeSchema>;

// ─── Pagination ───────────────────────────────────────────────────────────────

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// TODO: replace PaginationMeta with Paginated in web/api
