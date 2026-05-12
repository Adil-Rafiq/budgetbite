import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

/**
 * Create / upsert a pin. The server snapshots the current menuItem.price into
 * priceAtPin server-side — we never trust a client-supplied price for budget
 * math. budgetPlanId comes from the URL (`POST /api/budget-plans/:id/meal-pins`)
 * so it's intentionally absent here, mirroring the meal-choice convention.
 */
export const createMealPinSchema = z.object({
  slotDate: isoDateStringSchema,
  mealTypeId: uuidSchema,
  restaurantId: uuidSchema,
  menuItemId: uuidSchema,
});

export const listMealPinsQuerySchema = z.object({
  /** When set, returns only pins on this exact slotDate. */
  slotDate: isoDateStringSchema.optional(),
  /** When set, returns only pins on or after this date. Ignored if `slotDate` is supplied. */
  fromDate: isoDateStringSchema.optional(),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const mealPinResponseSchema = z.object({
  id: uuidSchema,
  budgetPlanId: uuidSchema,
  slotDate: isoDateStringSchema,
  mealTypeId: uuidSchema,
  restaurantId: uuidSchema,
  restaurantName: z.string(),
  menuItemId: uuidSchema,
  menuItemName: z.string(),
  menuItemDescription: z.string().nullable(),
  menuItemImageUrl: z.string().nullable(),
  priceAtPin: z.number(),
  createdAt: z.coerce.date(),
});

export const listMealPinsResponseSchema = z.array(mealPinResponseSchema);

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateMealPinInput = z.infer<typeof createMealPinSchema>;
export type ListMealPinsQuery = z.infer<typeof listMealPinsQuerySchema>;
export type MealPinResponse = z.infer<typeof mealPinResponseSchema>;
export type ListMealPinsResponse = z.infer<typeof listMealPinsResponseSchema>;
