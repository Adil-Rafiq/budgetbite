import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

export type CreatePlanStepId = 'budget' | 'notifications';

export type CreatePlanStep = {
  id: CreatePlanStepId;
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

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

export interface OnboardingSubmissionInput {
  budget: {
    planType: BudgetPlanType;
    totalBudget: number;
    mealTypeIds: string[];
    mealsPerDay: number;
  };
  notificationSlots: NotificationPreferencesInput['notificationSlots'];
}
