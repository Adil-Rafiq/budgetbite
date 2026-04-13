'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  budgetPlanPreferencesSchema,
  type BudgetPlanMealTypeOption,
  type BudgetPlanPreferencesInput,
} from '@/app/onboarding/types';
import type { MealType } from '@repo/shared';

export const useBudgetStep = (activeMealTypes: MealType[]) => {
  const form = useForm<BudgetPlanPreferencesInput>({
    resolver: zodResolver(budgetPlanPreferencesSchema),
    defaultValues: {
      planType: 'monthly',
      totalBudget: 45000,
      mealsPerDay: activeMealTypes.length ?? 1,
      mealTypeIds: [],
    },
  });

  const mealTypeOptions = useMemo<BudgetPlanMealTypeOption[]>(
    () =>
      activeMealTypes.map((mealType) => ({
        id: mealType.id,
        key: mealType.key,
        label: mealType.label,
        sortOrder: mealType.sortOrder,
      })),
    [activeMealTypes],
  );

  // Sync selected meal types with available(db) options.
  //
  // - Removes any previously selected IDs that are no longer valid.
  // - If some valid selections remain, updates the form only if needed.
  // - If none remain, initializes a default selection from available options.
  // - Keeps `mealsPerDay` in sync with the number of selected meal types.
  useEffect(() => {
    if (!mealTypeOptions.length) return;

    const selected = form.getValues('mealTypeIds');
    // Filter out any selected IDs that are no longer in the available options
    const normalized = selected.filter((id) => mealTypeOptions.some((option) => option.id === id));

    if (normalized.length > 0) {
      if (normalized.length !== selected.length) {
        form.setValue('mealTypeIds', normalized);
        form.setValue('mealsPerDay', normalized.length);
        form.trigger(['mealTypeIds', 'mealsPerDay']);
      }
      return;
    }

    const initialSelection = mealTypeOptions[0]?.id;
    if (initialSelection) {
      form.setValue('mealTypeIds', [initialSelection]);
      form.setValue('mealsPerDay', 1);
      form.trigger(['mealTypeIds', 'mealsPerDay']);
    }
  }, [mealTypeOptions, form]);

  const planType = form.watch('planType');
  const totalBudget = form.watch('totalBudget');
  const selectedMealTypeIds = form.watch('mealTypeIds');
  const mealsPerDay = form.watch('mealsPerDay');

  const setPlanType = (value: BudgetPlanPreferencesInput['planType']) => {
    form.setValue('planType', value, { shouldValidate: true });
  };

  const setTotalBudget = (value: number) => {
    form.setValue('totalBudget', Number.isFinite(value) ? value : 0, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const toggleMealType = (mealTypeId: string) => {
    const selected = form.getValues('mealTypeIds');
    const next = selected.includes(mealTypeId)
      ? selected.filter((id) => id !== mealTypeId)
      : [...selected, mealTypeId];

    // Set both without validating first
    form.setValue('mealTypeIds', next, { shouldDirty: true });
    form.setValue('mealsPerDay', next.length, { shouldDirty: true });

    // Trigger validation once after both are set
    form.trigger(['mealTypeIds', 'mealsPerDay']);
  };

  return {
    form,
    values: {
      planType: planType ?? 'monthly',
      totalBudget: Number.isFinite(totalBudget) ? totalBudget : 0,
      selectedMealTypeIds,
      mealsPerDay: mealsPerDay ?? selectedMealTypeIds.length,
    },
    errors: {
      totalBudget: form.formState.errors.totalBudget?.message,
      mealTypeIds: form.formState.errors.mealTypeIds?.message,
    },
    mealTypeOptions,
    actions: {
      setPlanType,
      setTotalBudget,
      toggleMealType,
    },
  };
};
