import { z } from 'zod';

import {
  isoDateStringSchema,
  paginationSchema,
  timeOfDayStringSchema,
  uuidSchema,
} from './common.js';
import { mealTypeSummarySchema } from './meal-type.js';
import { budgetStateContextSchema } from './budget-state.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const createBudgetPlanSchema = z
  .object({
    planType: z.enum(['weekly', 'monthly']),
    totalBudget: z.coerce.number().positive(),
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
    mealsPerDay: z.coerce.number().int().min(1).max(5),
    mealTypeIds: z.array(uuidSchema).min(1),
    notificationTimes: z.array(timeOfDayStringSchema).optional(),
  })
  .refine((data) => data.mealTypeIds.length === data.mealsPerDay, {
    message: 'mealTypeIds length must match mealsPerDay',
    path: ['mealTypeIds'],
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export const updateBudgetPlanSchema = z.object({
  totalBudget: z.coerce.number().positive().optional(),
  notificationTimes: z.array(timeOfDayStringSchema).optional(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

export const listBudgetPlansQuerySchema = paginationSchema.extend({
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

/**
 * The "raw" plan shape (mealTypeIds as an array of uuids, no computed fields).
 * Exported mostly for legacy FE imports — new code should prefer
 * `budgetPlanResponseSchema` which embeds `mealTypes[]` + computed spent/remaining.
 */
export const budgetPlanSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  planType: z.enum(['weekly', 'monthly']),
  totalBudget: z.coerce.number().positive(),
  startDate: isoDateStringSchema,
  endDate: isoDateStringSchema,
  mealsPerDay: z.coerce.number().int().min(1).max(5),
  mealTypeIds: z.array(uuidSchema).min(1),
  notificationTimes: z.array(timeOfDayStringSchema).optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Canonical response DTO for read endpoints. Embeds the plan's meal types and
 * pre-computed `spentAmount` / `remainingAmount` so list views never need a
 * second request.
 */
export const budgetPlanResponseSchema = budgetPlanSchema.omit({ mealTypeIds: true }).extend({
  mealTypes: z.array(mealTypeSummarySchema),
  spentAmount: z.number(),
  remainingAmount: z.number(),
});

/** Single-plan detail: response DTO + full running context + latest generation pointer. */
export const budgetPlanDetailSchema = budgetPlanResponseSchema.extend({
  context: budgetStateContextSchema,
  latestGeneration: z.object({ id: uuidSchema, generatedAt: z.coerce.date() }).nullable(),
});

/** Shape returned by GET /api/budget-plans/active — matches what the FE expects. */
export const activeBudgetPlanResponseSchema = z.object({
  plan: budgetPlanResponseSchema,
  budgetState: budgetStateContextSchema,
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateBudgetPlanInput = z.infer<typeof createBudgetPlanSchema>;
export type UpdateBudgetPlanInput = z.infer<typeof updateBudgetPlanSchema>;
export type ListBudgetPlansQuery = z.infer<typeof listBudgetPlansQuerySchema>;
export type BudgetPlan = z.infer<typeof budgetPlanSchema>;
export type BudgetPlanResponse = z.infer<typeof budgetPlanResponseSchema>;
export type BudgetPlanDetail = z.infer<typeof budgetPlanDetailSchema>;
export type ActiveBudgetPlanResponse = z.infer<typeof activeBudgetPlanResponseSchema>;
