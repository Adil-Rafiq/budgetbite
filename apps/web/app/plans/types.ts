import type { LucideIcon } from 'lucide-react';
import type { NotificationPreferencesInput } from '@/lib/budget-plan/schema';

export type CreatePlanStepId = 'budget' | 'notifications' | 'preview';

export type CreatePlanStep = {
  id: CreatePlanStepId;
  icon: LucideIcon;
  title: string;
  description: string;
};

/**
 * The budget and reminder contracts are shared with onboarding via
 * `@/lib/budget-plan/schema`. This file used to define its own, which is how
 * the dialog ended up accepting a ₨99,999,999 budget and a 6th meal type that
 * the API rejects — onboarding had capped both.
 */
export {
  MAX_TOTAL_BUDGET,
  MAX_MEALS_PER_DAY,
  budgetPlanPreferencesSchema,
  notificationSlotSchema,
  notificationPreferencesSchema,
} from '@/lib/budget-plan/schema';

export type {
  BudgetPlanType,
  BudgetPlanMealTypeOption,
  BudgetPlanPreferencesInput,
  NotificationSlotInput,
  NotificationPreferencesInput,
} from '@/lib/budget-plan/schema';

export interface OnboardingSubmissionInput {
  budget: {
    planType: 'weekly' | 'monthly';
    totalBudget: number;
    mealTypeIds: string[];
    mealsPerDay: number;
  };
  notificationSlots: NotificationPreferencesInput['notificationSlots'];
}
