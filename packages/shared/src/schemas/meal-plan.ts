import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const getSuggestionsSchema = z.object({
  date: isoDateStringSchema,
  mealTypeId: uuidSchema.optional(),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

/**
 * One menu item inside a suggestion option. Options are whole orders and can
 * combine several items (burger + wings + drink); `price` is this item's
 * estimated share of the option's combined `estimatedPrice`.
 */
export const suggestionOptionItemSchema = z.object({
  menuItemId: z.string(),
  menuItemName: z.string().nullable(),
  description: z.string().optional(),
  price: z.number(),
});

export const suggestionOptionSchema = z.object({
  id: z.string(),
  optionIndex: z.number(),
  restaurantId: z.string(),
  restaurantName: z.string().nullable(),
  /** The 1..N menu items composing this order, in AI-listed order. */
  items: z.array(suggestionOptionItemSchema).min(1),
  /** Combined cost of every item in the order. */
  estimatedPrice: z.number(),
  notes: z.string().optional(),
  /**
   * Where this option came from. 'pin' rows are user-locked overrides served
   * by mealPlanService.getSuggestionsForDay — the FE renders them with a
   * "Pinned" badge in place of the AI's suggestion.
   */
  source: z.enum(['suggestion', 'pin']).optional(),
});

export const suggestionSlotSchema = z.object({
  mealTypeId: z.string(),
  mealTypeKey: z.string(),
  mealTypeLabel: z.string(),
  options: z.array(suggestionOptionSchema),
});

export const getSuggestionsResponseSchema = z.object({
  date: z.string(),
  slots: z.array(suggestionSlotSchema),
});

export const generateMealPlanResponseSchema = z.object({
  generationId: z.string(),
  budgetPlanId: z.string(),
  generatedAt: z.coerce.date(),
  /** Number of suggestion rows persisted across all slots. Present on AI-backed generations. */
  suggestionCount: z.number().int().nonnegative().optional(),
  /** Short human-readable summary the LLM returned to describe the plan. */
  planSummary: z.string().optional(),
  /** Sum of estimated prices across all "best" picks per slot, as reported by the LLM. */
  estimatedTotalCost: z.number().nonnegative().optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type GetSuggestionsQuery = z.infer<typeof getSuggestionsSchema>;
export type SuggestionOptionItem = z.infer<typeof suggestionOptionItemSchema>;
export type SuggestionOption = z.infer<typeof suggestionOptionSchema>;
export type SuggestionSlot = z.infer<typeof suggestionSlotSchema>;
export type GetSuggestionsResponse = z.infer<typeof getSuggestionsResponseSchema>;
export type GenerateMealPlanResponse = z.infer<typeof generateMealPlanResponseSchema>;
