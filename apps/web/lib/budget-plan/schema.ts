import { z } from 'zod';

/**
 * The one definition of "what a budget plan form accepts".
 *
 * Onboarding and the /plans wizard ask the same three questions, and for a
 * while they answered them differently: onboarding capped the amount and the
 * meal count and wrote plain-language messages, while the plans dialog shipped
 * a bare `.positive()` that accepted ₨99,999,999 and let a 6th meal type
 * through to fail server-side as a generic toast. Both now import from here, so
 * a limit can only be wrong in one place.
 */

/** Mirrors the API's own ceiling; also stops a typo becoming a ₨1,111,111/meal plan. */
export const MAX_TOTAL_BUDGET = 1_000_000;

/**
 * The API caps a plan at 5 meals per day (`createBudgetPlanSchema`). Enforced
 * client-side so the user is stopped at the chip they cannot select, rather
 * than at the final submit with a 400 behind it.
 */
export const MAX_MEALS_PER_DAY = 5;

export type BudgetPlanType = 'weekly' | 'monthly';

export interface BudgetPlanMealTypeOption {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
}

export const budgetPlanPreferencesSchema = z.object({
  planType: z.enum(['weekly', 'monthly']),
  totalBudget: z
    .number({ message: 'Enter a budget amount' })
    .positive('Enter an amount above zero')
    .max(MAX_TOTAL_BUDGET, `Keep this under ${MAX_TOTAL_BUDGET.toLocaleString('en-US')}`),
  mealTypeIds: z
    .array(z.string().uuid())
    .min(1, 'Select at least one meal type')
    .max(MAX_MEALS_PER_DAY, `Pick up to ${MAX_MEALS_PER_DAY} meals a day`),
});

export type BudgetPlanPreferencesInput = z.infer<typeof budgetPlanPreferencesSchema>;

export const notificationSlotSchema = z.object({
  mealTypeId: z.string().uuid(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Pick a reminder time'),
  enabled: z.boolean(),
});

export type NotificationSlotInput = z.infer<typeof notificationSlotSchema>;

export const notificationPreferencesSchema = z.object({
  notificationSlots: z.array(notificationSlotSchema).min(1),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

/** Quick-pick amounts per plan type. Calibrated to Pakistani takeout spend. */
export const BUDGET_PRESETS: Record<BudgetPlanType, number[]> = {
  weekly: [3500, 7500, 12000, 20000],
  monthly: [15000, 30000, 45000, 60000],
};

export const DEFAULT_PLAN_TYPE: BudgetPlanType = 'monthly';
export const DEFAULT_TOTAL_BUDGET = 45000;
