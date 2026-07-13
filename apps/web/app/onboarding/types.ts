import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

export type OnboardingStepId = 'location' | 'dietary' | 'budget' | 'notifications';

export type OnboardingStepAccent = 'green' | 'dark-green' | 'tomato';

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

export const budgetPlanPreferencesSchema = z.object({
  planType: z.enum(['weekly', 'monthly']),
  totalBudget: z.number().positive(),
  mealTypeIds: z.array(z.string().uuid()).min(1, 'Select at least one meal type'),
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

export const locationPreferencesSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
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
