import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  startDate: isoDateStringSchema,
  endDate: isoDateStringSchema,
  budgetPlanId: uuidSchema.optional(),
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
  createdAt: z.date(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type SpendingDailyPoint = z.infer<typeof spendingDailyPointSchema>;
export type SpendingAnalytics = z.infer<typeof spendingAnalyticsSchema>;
export type MealHistoryItem = z.infer<typeof mealHistoryItemSchema>;
