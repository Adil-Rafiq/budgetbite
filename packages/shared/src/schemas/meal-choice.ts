import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

/**
 * planId comes from the URL path (`POST /api/budget-plans/:id/choices`) — not
 * the body — so it's intentionally absent here.
 *
 * `restaurantId` / `menuItemId` are the structured links to the catalogue. The
 * server backfills them from the suggestion when only `suggestionId` is
 * supplied. They remain optional so free-form "manual" entries (typed
 * description, no catalogue link) keep working unchanged.
 *
 * `isHomeCooked` marks a meal the user cooked at home instead of ordering out:
 * cost is user-entered, `manualDescription` holds an optional dish name, and the
 * server strips any restaurant/menu-item link (a home-cooked meal has none).
 */
export const recordMealChoiceSchema = z.object({
  slotDate: isoDateStringSchema,
  mealTypeId: uuidSchema,
  suggestionId: uuidSchema.optional(),
  restaurantId: uuidSchema.optional(),
  menuItemId: uuidSchema.optional(),
  manualDescription: z.string().max(500).optional(),
  actualAmountSpent: z.coerce.number().min(0),
  restaurantName: z.string().max(200).optional(),
  isHomeCooked: z.boolean().optional(),
});

// ─── Response DTO ───────────────────────────────────────────────────────────

export const mealChoiceResponseSchema = z.object({
  id: uuidSchema,
  budgetPlanId: uuidSchema,
  slotDate: z.string(),
  mealTypeId: uuidSchema,
  suggestionId: uuidSchema.nullable(),
  restaurantId: uuidSchema.nullable(),
  menuItemId: uuidSchema.nullable(),
  manualDescription: z.string().nullable(),
  actualAmountSpent: z.number(),
  restaurantName: z.string().nullable(),
  menuItemName: z.string().nullable(),
  isHomeCooked: z.boolean(),
  createdAt: z.coerce.date(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type RecordMealChoiceInput = z.infer<typeof recordMealChoiceSchema>;
export type MealChoiceResponse = z.infer<typeof mealChoiceResponseSchema>;
