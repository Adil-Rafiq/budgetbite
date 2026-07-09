import { z } from 'zod';

import { isoDateStringSchema, uuidSchema } from './common.js';
import { suggestionOptionSchema } from './meal-plan.js';

/**
 * Query for GET /budget-plans/:id/timeline. `today` is the client's local
 * calendar date — slot dates are user-local, so only the client knows which
 * one is "today" (the server's UTC clock lags Pakistan by 5 hours). The
 * server falls back to its own UTC date when omitted.
 */
export const getPlanTimelineQuerySchema = z.object({
  today: isoDateStringSchema.optional(),
});

/**
 * Pre-rendered "logged" projection of a meal_choice, attached to a timeline
 * slot when the user has confirmed a meal for (slotDate, mealTypeId). The
 * shape is denormalised so the FE can render the row without a second query.
 */
export const planTimelineLoggedChoiceSchema = z.object({
  id: uuidSchema,
  restaurantName: z.string().nullable(),
  menuItemName: z.string().nullable(),
  manualDescription: z.string().nullable(),
  actualAmountSpent: z.number(),
  isCustom: z.boolean(),
  /** True when the user cooked at home instead of ordering — no restaurant attached. */
  isHomeCooked: z.boolean(),
});

/**
 * Per-mealType cell in the timeline. Status is derived server-side from the
 * priority (logged > pinned > suggested > empty) so the FE doesn't need to
 * recompute it. `options` carries pin/suggestion options when status is
 * 'pinned' or 'suggested'; it is always [] for 'logged' / 'empty'.
 */
export const planTimelineSlotSchema = z.object({
  mealTypeId: uuidSchema,
  mealTypeKey: z.string(),
  mealTypeLabel: z.string(),
  status: z.enum(['logged', 'pinned', 'suggested', 'empty']),
  loggedChoice: planTimelineLoggedChoiceSchema.nullable(),
  options: z.array(suggestionOptionSchema),
});

export const planTimelineDaySchema = z.object({
  slotDate: isoDateStringSchema,
  /**
   * Grouping marker computed against the client-supplied `today` query param
   * (falling back to server UTC), so the FE can group/style days directly.
   */
  relative: z.enum(['past', 'today', 'future']),
  slots: z.array(planTimelineSlotSchema),
});

export const planTimelineResponseSchema = z.object({
  planId: uuidSchema,
  startDate: isoDateStringSchema,
  endDate: isoDateStringSchema,
  /** Pointer to the active generation whose suggestions populate `suggested` slots, when present. */
  activeGenerationId: uuidSchema.nullable(),
  days: z.array(planTimelineDaySchema),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type GetPlanTimelineQuery = z.infer<typeof getPlanTimelineQuerySchema>;
export type PlanTimelineLoggedChoice = z.infer<typeof planTimelineLoggedChoiceSchema>;
export type PlanTimelineSlot = z.infer<typeof planTimelineSlotSchema>;
export type PlanTimelineDay = z.infer<typeof planTimelineDaySchema>;
export type PlanTimelineResponse = z.infer<typeof planTimelineResponseSchema>;
