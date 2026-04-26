import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

/**
 * planId comes from the URL path (`POST /api/budget-plans/:id/choices`) — not
 * the body — so it's intentionally absent here.
 */
export const recordMealChoiceSchema = z.object({
  slotDate: isoDateStringSchema,
  mealTypeId: uuidSchema,
  suggestionId: uuidSchema.optional(),
  manualDescription: z.string().max(500).optional(),
  actualAmountSpent: z.coerce.number().min(0),
  restaurantName: z.string().max(200).optional(),
});

// ─── Response DTO ───────────────────────────────────────────────────────────

export const mealChoiceResponseSchema = z.object({
  id: uuidSchema,
  budgetPlanId: uuidSchema,
  slotDate: z.string(),
  mealTypeId: uuidSchema,
  suggestionId: uuidSchema.nullable(),
  manualDescription: z.string().nullable(),
  actualAmountSpent: z.number(),
  restaurantName: z.string().nullable(),
  createdAt: z.coerce.date(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type RecordMealChoiceInput = z.infer<typeof recordMealChoiceSchema>;
export type MealChoiceResponse = z.infer<typeof mealChoiceResponseSchema>;
