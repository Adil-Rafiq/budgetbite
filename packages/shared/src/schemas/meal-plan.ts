import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const getSuggestionsSchema = z.object({
  date: isoDateStringSchema,
  mealTypeId: uuidSchema.optional(),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const suggestionOptionSchema = z.object({
  id: z.string(),
  optionIndex: z.number(),
  restaurantId: z.string(),
  restaurantName: z.string().nullable(),
  menuItemId: z.string(),
  menuItemName: z.string().nullable(),
  description: z.string().optional(),
  estimatedPrice: z.number(),
  notes: z.string().optional(),
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
export type SuggestionOption = z.infer<typeof suggestionOptionSchema>;
export type SuggestionSlot = z.infer<typeof suggestionSlotSchema>;
export type GetSuggestionsResponse = z.infer<typeof getSuggestionsResponseSchema>;
export type GenerateMealPlanResponse = z.infer<typeof generateMealPlanResponseSchema>;