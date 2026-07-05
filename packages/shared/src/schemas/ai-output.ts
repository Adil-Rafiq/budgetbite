import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

/**
 * Strict schema describing the JSON the LLM is expected to return on a plan
 * generation or replan request. Any deviation (missing field, wrong type,
 * non-UUID id, fewer than 3 options, bad mealTypeKey shape, etc.) fails fast
 * before we touch the database.
 */

/** One menu item inside a suggested order (a combo has several). */
export const aiPlanOptionItemSchema = z.object({
  menuItemId: uuidSchema,
  estimatedPrice: z.number().nonnegative(),
});

/**
 * One option = one order placed at a single restaurant, composed of 1-4 menu
 * items (e.g. burger + wings + drink for one lunch). The option's total cost
 * is derived server-side by summing the item prices.
 */
export const aiPlanOptionSchema = z.object({
  optionIndex: z.number().int().min(0).max(2),
  restaurantId: uuidSchema,
  items: z.array(aiPlanOptionItemSchema).min(1).max(4),
  notes: z.string().max(500).optional(),
});

export const aiPlanSlotSchema = z.object({
  slotDate: isoDateStringSchema,
  mealTypeKey: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_-]*$/, 'mealTypeKey must be lowercase with no whitespace'),
  options: z.array(aiPlanOptionSchema).length(3),
});

export const aiPlanOutputSchema = z.object({
  slots: z.array(aiPlanSlotSchema).min(1),
  planSummary: z.string().min(1),
  estimatedTotalCost: z.number().nonnegative(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type AIPlanOptionItem = z.infer<typeof aiPlanOptionItemSchema>;
export type AIPlanOption = z.infer<typeof aiPlanOptionSchema>;
export type AIPlanSlot = z.infer<typeof aiPlanSlotSchema>;
export type AIPlanOutput = z.infer<typeof aiPlanOutputSchema>;
