import { z } from 'zod';

import { paginatedSchema, paginationSchema, uuidSchema } from './common.js';

// Admin-facing, read-only views of budget plans across all users. Kept separate
// from the user-facing budget-plan DTOs (which carry pin-adjusted budget state)
// because admins inspect raw plan + generation + suggestion data.

const generationStatusSchema = z.enum(['pending', 'succeeded', 'failed', 'superseded']);
const planStatusSchema = z.enum(['active', 'completed', 'cancelled']);

export const adminPlanGenerationSchema = z.object({
  id: uuidSchema,
  generatedAt: z.coerce.date(),
  status: generationStatusSchema,
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  completedAt: z.coerce.date().nullable(),
});

export const adminPlanOwnerSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  email: z.string(),
});

export const adminPlanListItemSchema = z.object({
  id: uuidSchema,
  user: adminPlanOwnerSchema,
  planType: z.enum(['weekly', 'monthly']),
  totalBudget: z.number(),
  status: planStatusSchema,
  startDate: z.string(),
  endDate: z.string(),
  mealsPerDay: z.number().int(),
  latestAttempt: adminPlanGenerationSchema.nullable(),
  createdAt: z.coerce.date(),
});

export const adminPlanListResponseSchema = paginatedSchema(adminPlanListItemSchema);

export const listAdminPlansQuerySchema = paginationSchema.extend({
  status: planStatusSchema.optional(),
});

export const adminPlanContextSchema = z
  .object({
    totalBudget: z.number(),
    amountSpent: z.number(),
    amountRemaining: z.number(),
    totalMeals: z.number().int(),
    mealsConsumed: z.number().int(),
    mealsRemaining: z.number().int(),
    avgBudgetPerRemainingMeal: z.number(),
    cumulativeVariance: z.number(),
  })
  .nullable();

export const adminPlanMealTypeSchema = z.object({
  id: uuidSchema,
  key: z.string(),
  label: z.string(),
  sortOrder: z.number().int(),
});

export const adminPlanSuggestionSchema = z.object({
  id: uuidSchema,
  slotDate: z.string(),
  optionIndex: z.number().int(),
  /** Combined cost of every menu item in the suggested order. */
  estimatedPrice: z.number(),
  notes: z.string().nullable(),
  mealType: z.object({ key: z.string(), label: z.string() }),
  restaurant: z.object({ id: uuidSchema, name: z.string() }),
  /** The 1..N menu items composing the suggested order (combos have several). */
  menuItems: z.array(z.object({ id: uuidSchema, name: z.string(), price: z.number() })),
});

export const adminPlanDetailSchema = adminPlanListItemSchema.extend({
  context: adminPlanContextSchema,
  mealTypes: z.array(adminPlanMealTypeSchema),
  generations: z.array(adminPlanGenerationSchema),
  activeGenerationId: uuidSchema.nullable(),
  suggestions: z.array(adminPlanSuggestionSchema),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type AdminPlanGeneration = z.infer<typeof adminPlanGenerationSchema>;
export type AdminPlanListItem = z.infer<typeof adminPlanListItemSchema>;
export type AdminPlanListResponse = z.infer<typeof adminPlanListResponseSchema>;
export type ListAdminPlansQuery = z.infer<typeof listAdminPlansQuerySchema>;
export type AdminPlanDetail = z.infer<typeof adminPlanDetailSchema>;
export type AdminPlanSuggestion = z.infer<typeof adminPlanSuggestionSchema>;
