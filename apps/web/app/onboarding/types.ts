import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

export type OnboardingStepId = 'location' | 'budget' | 'notifications';

export type OnboardingStep = {
  id: OnboardingStepId;
  icon: LucideIcon;
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

export const notificationSlotSchema = z.object({
  mealTypeId: z.string().uuid(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export type NotificationSlotInput = z.infer<typeof notificationSlotSchema>;

export const budgetPlanPreferencesSchema = z
  .object({
    planType: z.enum(['weekly', 'monthly']),
    totalBudget: z.number().positive(),
    mealsPerDay: z.number().int().min(1).max(5),
    mealTypeIds: z.array(z.string().uuid()).min(1),
  })
  .refine((value) => value.mealTypeIds.length === value.mealsPerDay, {
    message: 'Selected meal types must match meals per day',
    path: ['mealTypeIds'],
  });

export const notificationPreferencesSchema = z.object({
  notificationSlots: z.array(notificationSlotSchema).min(1),
});

export const locationPreferencesSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type BudgetPlanPreferencesInput = z.infer<typeof budgetPlanPreferencesSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type LocationPreferencesInput = z.infer<typeof locationPreferencesSchema>;

export interface OnboardingSubmissionInput {
  location: LocationPreferencesInput;
  budget: BudgetPlanPreferencesInput;
  notificationSlots: NotificationPreferencesInput['notificationSlots'];
}
