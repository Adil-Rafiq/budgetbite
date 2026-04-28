import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

/**
 * Strict schema describing the JSON the LLM is expected to return on a plan
 * generation or replan request. Any deviation (missing field, wrong type,
 * non-UUID id, fewer than 3 options, bad mealTypeKey shape, etc.) fails fast
 * before we touch the database.
 */

export const aiPlanOptionSchema = z.object({
  optionIndex: z.number().int().min(0).max(2),
  restaurantId: uuidSchema,
  menuItemId: uuidSchema,
  estimatedPrice: z.number().nonnegative(),
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

export type AIPlanOption = z.infer<typeof aiPlanOptionSchema>;
export type AIPlanSlot = z.infer<typeof aiPlanSlotSchema>;
export type AIPlanOutput = z.infer<typeof aiPlanOutputSchema>;
