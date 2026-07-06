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

// ─── Menu image extraction output ────────────────────────────────────────────

/**
 * What the LLM returns when asked to read menu items off a photo. Deliberately
 * loose (price may come back as a string, descriptions may be null/missing);
 * the service sanitizes each item against `recommendationItemInputSchema` and
 * drops the ones that don't survive, so one garbled row never fails the whole
 * extraction. The array cap bounds how much model output we ever process.
 */
export const aiMenuExtractionOutputSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.coerce.number(),
        description: z.string().nullish(),
        /** ISO code or symbol when the printed price is clearly not PKR. */
        foreignCurrency: z.string().nullish(),
      }),
    )
    .max(100),
});

// ─── Inferred types ──────────────────────────────────────────────────────────

export type AIPlanOptionItem = z.infer<typeof aiPlanOptionItemSchema>;
export type AIPlanOption = z.infer<typeof aiPlanOptionSchema>;
export type AIPlanSlot = z.infer<typeof aiPlanSlotSchema>;
export type AIPlanOutput = z.infer<typeof aiPlanOutputSchema>;
export type AIMenuExtractionOutput = z.infer<typeof aiMenuExtractionOutputSchema>;
