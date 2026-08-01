import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

/**
 * `startDate <= endDate` is enforced here rather than left to the caller.
 * An inverted range is not an empty range: it returns zero rows, which the
 * analytics surface can only render as "you spent nothing in this period" —
 * indistinguishable from a true empty range, and a false statement about the
 * user's money. Rejecting it makes the mistake correctable instead of silent.
 */
export const analyticsQuerySchema = z
  .object({
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
    budgetPlanId: uuidSchema.optional(),
  })
  .refine((q) => q.startDate <= q.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['startDate'],
  });

export const spendingDailyPointSchema = z.object({
  date: isoDateStringSchema,
  amount: z.number().nonnegative(),
});

export const spendingAnalyticsSchema = z.object({
  startDate: isoDateStringSchema,
  endDate: isoDateStringSchema,
  totalSpent: z.number().nonnegative(),
  mealCount: z.number().nonnegative().int(),
  daily: z.array(spendingDailyPointSchema),
});

export const mealHistoryItemSchema = z.object({
  id: uuidSchema,
  slotDate: isoDateStringSchema,
  mealTypeId: uuidSchema,
  actualAmountSpent: z.number().nonnegative(),
  restaurantName: z.string().nullable(),
  manualDescription: z.string().nullable(),
  /**
   * Carried through so analytics can name a home-cooked meal the same way the
   * dashboard does. `meal_choice.is_home_cooked` exists as an explicit flag
   * precisely so display code need not infer it from null restaurant fields;
   * omitting it here made one logged meal read as a dish on the dashboard and
   * as an em-dash on this surface.
   */
  isHomeCooked: z.boolean(),
  createdAt: z.date(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type SpendingDailyPoint = z.infer<typeof spendingDailyPointSchema>;
export type SpendingAnalytics = z.infer<typeof spendingAnalyticsSchema>;
export type MealHistoryItem = z.infer<typeof mealHistoryItemSchema>;
