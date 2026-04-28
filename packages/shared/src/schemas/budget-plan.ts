import { z } from 'zod';

import {
  isoDateStringSchema,
  paginatedSchema,
  paginationSchema,
  timeOfDayStringSchema,
  uuidSchema,
} from './common.js';
import { mealTypeSummarySchema } from './meal-type.js';
import { budgetStateContextSchema } from './budget-state.js';
import { suggestionSlotSchema } from './meal-plan.js';

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

/**
 * DTO for meal plan generation metadata.
 *
 * `status` lifecycle: pending -> succeeded | failed | superseded.
 * `errorCode` / `errorMessage` populated only when status='failed'.
 * `completedAt` set on every terminal transition; null while pending.
 */
export const budgetGenerationSchema = z.object({
  id: uuidSchema,
  generatedAt: z.coerce.date(),
  status: z.enum(['pending', 'succeeded', 'failed', 'superseded']),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  completedAt: z.coerce.date().nullable(),
});

/**
 * Single-plan detail. Two generation pointers, intentionally split:
 *  - `activeGeneration`: latest *succeeded* generation. Drives the suggestions
 *    screen. Stable across pending/failed/superseded replans, so the in-place
 *    plan never visibly disappears.
 *  - `latestAttempt`: latest generation by generatedAt regardless of status.
 *    Drives "regenerating…" / "replan failed: X" UX banners. May equal
 *    activeGeneration when no newer attempt exists.
 */
export const budgetPlanDetailSchema = budgetPlanResponseSchema.extend({
  context: budgetStateContextSchema,
  activeGeneration: budgetGenerationSchema.nullable(),
  latestAttempt: budgetGenerationSchema.nullable(),
});

/** Shape returned by GET /api/budget-plans/active — matches what the FE expects. */
export const activeBudgetPlanResponseSchema = z.object({
  plan: budgetPlanResponseSchema,
  budgetState: budgetStateContextSchema,
});

// ─── Generation history (FE detail page) ────────────────────────────────────

/** Paginated envelope for GET /api/budget-plans/:id/generations. */
export const listBudgetGenerationsResponseSchema = paginatedSchema(budgetGenerationSchema);

/** One day's worth of slots inside a single generation's detail payload. */
export const budgetGenerationDayGroupSchema = z.object({
  slotDate: isoDateStringSchema,
  slots: z.array(suggestionSlotSchema),
});

/**
 * Shape returned by GET /api/budget-plans/:id/generations/:gid.
 * `days` is empty for non-succeeded statuses; the gen row's `errorCode` /
 * `errorMessage` carry the relevant context in that case.
 */
export const budgetGenerationDetailResponseSchema = z.object({
  generation: budgetGenerationSchema,
  days: z.array(budgetGenerationDayGroupSchema),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateBudgetPlanInput = z.infer<typeof createBudgetPlanSchema>;
export type UpdateBudgetPlanInput = z.infer<typeof updateBudgetPlanSchema>;
export type ListBudgetPlansQuery = z.infer<typeof listBudgetPlansQuerySchema>;
export type BudgetPlan = z.infer<typeof budgetPlanSchema>;
export type BudgetPlanResponse = z.infer<typeof budgetPlanResponseSchema>;
export type BudgetGeneration = z.infer<typeof budgetGenerationSchema>;
export type BudgetPlanDetail = z.infer<typeof budgetPlanDetailSchema>;
export type ActiveBudgetPlanResponse = z.infer<typeof activeBudgetPlanResponseSchema>;
export type ListBudgetGenerationsResponse = z.infer<typeof listBudgetGenerationsResponseSchema>;
export type BudgetGenerationDayGroup = z.infer<typeof budgetGenerationDayGroupSchema>;
export type BudgetGenerationDetailResponse = z.infer<typeof budgetGenerationDetailResponseSchema>;
