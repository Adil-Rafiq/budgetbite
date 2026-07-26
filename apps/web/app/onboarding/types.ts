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

export type BudgetPlanType = 'weekly' | 'monthly';

export interface BudgetPlanMealTypeOption {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
}

export const MAX_TOTAL_BUDGET = 1_000_000;

export const budgetPlanPreferencesSchema = z.object({
  planType: z.enum(['weekly', 'monthly']),
  totalBudget: z
    .number({ message: 'Enter a budget amount' })
    .positive('Enter an amount above zero')
    .max(MAX_TOTAL_BUDGET, `Keep this under ${MAX_TOTAL_BUDGET.toLocaleString('en-US')}`),
  // The API caps a plan at 5 meals/day; stop the user here rather than at the
  // final Launch click, which would fail validation server-side.
  mealTypeIds: z
    .array(z.string().uuid())
    .min(1, 'Select at least one meal type')
    .max(5, 'Pick up to 5 meals a day'),
});

export type BudgetPlanPreferencesInput = z.infer<typeof budgetPlanPreferencesSchema>;

export const notificationSlotSchema = z.object({
  mealTypeId: z.string().uuid(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  enabled: z.boolean(),
});

export type NotificationSlotInput = z.infer<typeof notificationSlotSchema>;

export const notificationPreferencesSchema = z.object({
  notificationSlots: z.array(notificationSlotSchema).min(1),
});

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

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
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
