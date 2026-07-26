import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

export type OnboardingStepId = 'location' | 'dietary' | 'budget' | 'notifications' | 'review';

export type OnboardingStepAccent = 'green' | 'dark-green';

export type OnboardingStep = {
  id: OnboardingStepId;
  icon: LucideIcon;
  /** Short eyebrow label, e.g. "Your location". */
  label: string;
  /** Accent used for the eyebrow chip / step icon. */
  accent: OnboardingStepAccent;
  title: string;
  description: string;
};

/**
 * The budget and reminder contracts live in `@/lib/budget-plan/schema` so this
 * flow and the /plans wizard cannot drift apart on caps or error copy. Only the
 * onboarding-specific steps (location, dietary) are defined here.
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

import type { NotificationPreferencesInput } from '@/lib/budget-plan/schema';

/**
 * Both coordinates are required. They used to be optional, which let the map's
 * default view double as a submitted value — a user who tapped straight through
 * silently saved Karachi as their home and was never asked again.
 */
export const locationPreferencesSchema = z.object({
  latitude: z.number({ message: 'Pick your location on the map' }).min(-90).max(90),
  longitude: z.number({ message: 'Pick your location on the map' }).min(-180).max(180),
});

export const dietaryPreferencesSchema = z.object({
  dietaryPreferences: z.array(z.string().trim().min(1).max(60)).max(20),
  allergens: z.array(z.string().trim().min(1).max(60)).max(20),
});

export type LocationPreferencesInput = z.infer<typeof locationPreferencesSchema>;
export type DietaryPreferencesInput = z.infer<typeof dietaryPreferencesSchema>;

export interface OnboardingSubmissionInput {
  location: LocationPreferencesInput;
  budget: {
    planType: 'weekly' | 'monthly';
    totalBudget: number;
    mealTypeIds: string[];
    mealsPerDay: number;
  };
  notificationSlots: NotificationPreferencesInput['notificationSlots'];
}
