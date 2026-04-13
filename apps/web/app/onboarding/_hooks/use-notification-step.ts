'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  notificationPreferencesSchema,
  type BudgetPlanMealTypeOption,
  type NotificationPreferencesInput,
} from '@/app/onboarding/types';

const buildNotificationSlotsForMeals = (
  current: NotificationPreferencesInput['notificationSlots'],
  selectedMealTypeIds: string[],
) => {
  const normalizedMeals = selectedMealTypeIds.length > 0 ? selectedMealTypeIds : current.map((slot) => slot.mealTypeId);

  return normalizedMeals.map((mealTypeId) => ({
    mealTypeId,
    time: current.find((slot) => slot.mealTypeId === mealTypeId)?.time ?? '',
  }));
};

export const useNotificationStep = (
  selectedMealTypeIds: string[],
  mealTypeOptions: BudgetPlanMealTypeOption[],
) => {
  const form = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      notificationSlots: [],
    },
  });

  useEffect(() => {
    const currentSlots = form.getValues('notificationSlots');
    const nextSlots = buildNotificationSlotsForMeals(currentSlots, selectedMealTypeIds);

    if (
      currentSlots.length === nextSlots.length &&
      currentSlots.every(
        (slot, index) =>
          slot.mealTypeId === nextSlots[index]?.mealTypeId && slot.time === nextSlots[index]?.time,
      )
    ) {
      return;
    }

    form.setValue('notificationSlots', nextSlots, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form, selectedMealTypeIds]);

  const notificationSlots = form.watch('notificationSlots');

  const updateNotificationTime = (mealTypeId: string, value: string) => {
    const current = form.getValues('notificationSlots');
    form.setValue(
      'notificationSlots',
      current.map((slot) => (slot.mealTypeId === mealTypeId ? { ...slot, time: value } : slot)),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const slots = notificationSlots.map((slot) => ({
    mealTypeId: slot.mealTypeId,
    mealTypeLabel: mealTypeOptions.find((option) => option.id === slot.mealTypeId)?.label ?? 'Meal slot',
    time: slot.time,
  }));

  return {
    form,
    values: {
      slots,
      mealsPerDayText: `Set one reminder per meal slot (${slots.length} total).`,
    },
    errors: {
      notificationSlots: form.formState.errors.notificationSlots?.message,
    },
    actions: {
      updateNotificationTime,
    },
  };
};
