'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { convertBudgetForPlanType, planBudgetBreakdown, type MealType } from '@repo/shared';
import {
  BUDGET_PRESETS,
  DEFAULT_PLAN_TYPE,
  DEFAULT_TOTAL_BUDGET,
  MAX_MEALS_PER_DAY,
  MAX_TOTAL_BUDGET,
  budgetPlanPreferencesSchema,
  type BudgetPlanMealTypeOption,
  type BudgetPlanPreferencesInput,
} from '@/lib/budget-plan/schema';
import { PLANS_DRAFT_KEY } from '@/app/plans/_lib/draft';
import { patchDraftIn, readDraftFrom } from '@/lib/budget-plan/draft-storage';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useBudgetStep = (activeMealTypes: MealType[]) => {
  const form = useForm<BudgetPlanPreferencesInput>({
    resolver: zodResolver(budgetPlanPreferencesSchema),
    defaultValues: {
      planType: DEFAULT_PLAN_TYPE,
      totalBudget: DEFAULT_TOTAL_BUDGET,
      mealTypeIds: [],
    },
  });

  /** Set when the plan type switch rescaled the amount, so the UI can say so. */
  const [lastConversion, setLastConversion] = useState<{ from: number; to: number } | null>(null);
  const restoredDraft = useRef(false);

  // Restore an interrupted attempt. In an effect rather than defaultValues
  // because sessionStorage does not exist during SSR.
  useEffect(() => {
    if (restoredDraft.current) return;
    restoredDraft.current = true;

    const draft = readDraftFrom(PLANS_DRAFT_KEY);
    if (draft.planType) form.setValue('planType', draft.planType);
    if (typeof draft.totalBudget === 'number') form.setValue('totalBudget', draft.totalBudget);
    // mealTypeIds are restored through the reconciliation effect below, which
    // drops any id that is no longer a valid meal type.
    if (draft.mealTypeIds?.length) form.setValue('mealTypeIds', draft.mealTypeIds);
  }, [form]);

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

  // Sync selected meal types with available (DB) options: drop ids that are no
  // longer valid, and seed the first option when nothing valid remains.
  useEffect(() => {
    if (!mealTypeOptions.length) return;

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
  const atMealTypeLimit = mealsPerDay >= MAX_MEALS_PER_DAY;

  /**
   * Derived from live values rather than `formState.isValid`, which is stale
   * under the default `onSubmit` mode. Gates Next so the preview step can never
   * be reached with an empty or over-cap budget.
   */
  const isComplete =
    Number.isFinite(totalBudget) &&
    totalBudget > 0 &&
    totalBudget <= MAX_TOTAL_BUDGET &&
    mealsPerDay >= 1 &&
    mealsPerDay <= MAX_MEALS_PER_DAY;

  // Mirror to the draft so an interruption restores what the user could last
  // see. Keyed on a joined string because `watch` hands back a fresh array
  // identity every render, which would otherwise write on each one.
  const mealTypeIdsKey = selectedMealTypeIds.join(',');
  useEffect(() => {
    patchDraftIn(PLANS_DRAFT_KEY, {
      planType,
      totalBudget: Number.isFinite(totalBudget) ? totalBudget : undefined,
      mealTypeIds: mealTypeIdsKey ? mealTypeIdsKey.split(',') : [],
    });
  }, [planType, totalBudget, mealTypeIdsKey]);

  /**
   * The same arithmetic the API runs when it creates the plan, so the per-meal
   * figure previewed here is the one the dashboard shows minutes later.
   */
  const breakdown = useMemo(
    () => planBudgetBreakdown({ planType, totalBudget, mealsPerDay }),
    [planType, totalBudget, mealsPerDay],
  );

  const presets = BUDGET_PRESETS[planType];

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Switching period rescales the amount instead of silently reinterpreting it:
   * ₨45,000/month is not ₨45,000/week, and quietly changing what a number means
   * by 4x is exactly the drift "Honest money UI" rules out.
   */
  const setPlanType = (value: BudgetPlanPreferencesInput['planType']) => {
    const current = form.getValues('planType');
    if (current === value) return;

    const amount = form.getValues('totalBudget');
    form.setValue('planType', value, { shouldValidate: true, shouldDirty: true });

    if (!Number.isFinite(amount) || amount <= 0) {
      setLastConversion(null);
      return;
    }

    const converted = convertBudgetForPlanType(amount, current, value);
    form.setValue('totalBudget', converted, { shouldValidate: true, shouldDirty: true });
    setLastConversion({ from: amount, to: converted });
  };

  /** Accepts NaN for an empty field so Zod reports "enter an amount" rather
   *  than the field silently becoming a literal 0 the user has to delete. */
  const setTotalBudget = (value: number) => {
    setLastConversion(null);
    form.setValue('totalBudget', value, { shouldValidate: true, shouldDirty: true });
  };

  const toggleMealType = (mealTypeId: string) => {
    const selected = form.getValues('mealTypeIds');
    const isRemoving = selected.includes(mealTypeId);

    // The API caps a plan at MAX_MEALS_PER_DAY; refuse the extra selection here
    // rather than letting the final Create click fail with a 400.
    if (!isRemoving && selected.length >= MAX_MEALS_PER_DAY) return;

    // Keep the selection in canonical menu order (breakfast < lunch < dinner)
    // rather than click order — this array drives the notification step and
    // the persisted position of each meal type on the plan.
    const optionOrder = new Map(mealTypeOptions.map((opt, i) => [opt.id, i]));
    const next = isRemoving
      ? selected.filter((id) => id !== mealTypeId)
      : [...selected, mealTypeId].sort(
          (a, b) => (optionOrder.get(a) ?? 0) - (optionOrder.get(b) ?? 0),
        );

    // Set value first, then validate once — avoids refine timing issues
    form.setValue('mealTypeIds', next, { shouldDirty: true });
    form.trigger('mealTypeIds');
  };

  /**
   * Re-seed the step when the dialog opens: defaults, overlaid with whatever
   * draft survives. Deliberately *not* a draft wipe — the draft is what makes a
   * reopen after an interruption restore the user's numbers. Completing or
   * explicitly discarding a plan clears it, so a fresh open starts fresh.
   */
  const reset = useCallback(() => {
    setLastConversion(null);
    const draft = readDraftFrom(PLANS_DRAFT_KEY);
    form.reset({
      planType: draft.planType ?? DEFAULT_PLAN_TYPE,
      totalBudget:
        typeof draft.totalBudget === 'number' ? draft.totalBudget : DEFAULT_TOTAL_BUDGET,
      mealTypeIds: draft.mealTypeIds ?? [],
    });
  }, [form]);

  return {
    // Expose only what components need — not the raw form instance
    handleSubmit: form.handleSubmit,
    trigger: form.trigger,
    getValues: () => form.getValues(),
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    reset,

    values: {
      planType,
      totalBudget,
      selectedMealTypeIds,
      mealsPerDay,
    },

    /** Period arithmetic shared with the API. */
    breakdown,
    presets,
    atMealTypeLimit,
    isComplete,
    lastConversion,

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
