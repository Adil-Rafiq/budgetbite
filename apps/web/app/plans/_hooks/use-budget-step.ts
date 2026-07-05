import { MealType } from '@repo/shared';
import { useForm } from 'react-hook-form';
import {
  BudgetPlanMealTypeOption,
  BudgetPlanPreferencesInput,
  budgetPlanPreferencesSchema,
} from '@/app/plans/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useBudgetStep = (activeMealTypes: MealType[]) => {
  const form = useForm<BudgetPlanPreferencesInput>({
    resolver: zodResolver(budgetPlanPreferencesSchema),
    defaultValues: {
      planType: 'monthly',
      totalBudget: 45000,
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

  useEffect(() => {
    if (!mealTypeOptions) return;

    const selected = form.getValues('mealTypeIds');
    const normalized = selected.filter((id) => mealTypeOptions.some((option) => option.id === id));

    if (normalized.length > 0) {
      if (normalized.length !== selected.length) {
        form.setValue('mealTypeIds', normalized);
        form.trigger('mealTypeIds');
      }
      return;
    }

    const firstOption = mealTypeOptions[0]?.id;
    if (firstOption) {
      form.setValue('mealTypeIds', [firstOption]);
      form.trigger('mealTypeIds');
    }
  }, [mealTypeOptions, form]);

  // ─── Watched values ──────────────────────────────────────────────────────

  const planType = form.watch('planType');
  const totalBudget = form.watch('totalBudget');
  const selectedMealTypeIds = form.watch('mealTypeIds');

  const mealsPerDay = selectedMealTypeIds.length;

  // ─── Actions ──────────────────────────────────────────────────────────────

  const setPlanType = (value: BudgetPlanPreferencesInput['planType']) => {
    form.setValue('planType', value, { shouldValidate: true, shouldDirty: true });
  };

  const setTotalBudget = (value: number) => {
    form.setValue('totalBudget', value, { shouldValidate: true, shouldDirty: true });
  };

  const toggleMealType = (mealTypeId: string) => {
    const selected = form.getValues('mealTypeIds');
    // Keep the selection in canonical menu order (breakfast < lunch < dinner)
    // rather than click order — this array drives the notification step and
    // the persisted position of each meal type on the plan.
    const optionOrder = new Map(mealTypeOptions.map((opt, i) => [opt.id, i]));
    const next = selected.includes(mealTypeId)
      ? selected.filter((id) => id !== mealTypeId)
      : [...selected, mealTypeId].sort(
          (a, b) => (optionOrder.get(a) ?? 0) - (optionOrder.get(b) ?? 0),
        );

    // Set value first, then validate once — avoids refine timing issues
    form.setValue('mealTypeIds', next, { shouldDirty: true });
    form.trigger('mealTypeIds');
  };

  return {
    // Expose only what components need — not the raw form instance
    handleSubmit: form.handleSubmit,
    trigger: form.trigger,
    getValues: () => form.getValues(),
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,

    values: {
      planType,
      totalBudget: Number.isFinite(totalBudget) ? totalBudget : 0,
      selectedMealTypeIds,
      mealsPerDay,
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
