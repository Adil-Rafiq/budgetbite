'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { convertBudgetForPlanType, planBudgetBreakdown } from '@repo/shared';
import {
  budgetPlanPreferencesSchema,
  MAX_TOTAL_BUDGET,
  type BudgetPlanMealTypeOption,
  type BudgetPlanPreferencesInput,
} from '@/app/onboarding/types';
import { MAX_MEALS_PER_DAY } from '@/app/onboarding/constants';
import { patchDraft, readDraft } from '@/app/onboarding/_lib/draft-storage';
import { BUDGET_PRESETS, DEFAULT_PLAN_TYPE, DEFAULT_TOTAL_BUDGET } from '@/lib/budget-plan/schema';
import type { MealType } from '@repo/shared';

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

  // Restore an interrupted session's budget. Done in an effect rather than in
  // defaultValues so the server-rendered markup and the first client render
  // agree — sessionStorage does not exist during SSR.
  useEffect(() => {
    if (restoredDraft.current) return;
    restoredDraft.current = true;

    const draft = readDraft();
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

  // Sync selected meal types with available (DB) options.
  //
  // - Removes any previously selected IDs that are no longer valid.
  // - If some valid selections remain, updates the form only if the list changed.
  // - If none remain, initializes with the first available option.
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
   * Derived from the live values rather than `formState.isValid`, which is
   * stale under the default `onSubmit` mode. Gates Continue so the review step
   * can never be reached with an empty budget — it used to be possible to clear
   * the field, walk forward twice, and read "₨ NaN" back as your plan.
   */
  const isComplete =
    Number.isFinite(totalBudget) &&
    totalBudget > 0 &&
    totalBudget <= MAX_TOTAL_BUDGET &&
    mealsPerDay >= 1 &&
    mealsPerDay <= MAX_MEALS_PER_DAY;

  // Keep the draft in step with the form so an interruption at any moment
  // restores what the user could last see. Keyed on a joined string because
  // `watch` hands back a fresh array identity on every render, which would
  // otherwise write to sessionStorage on each one.
  const mealTypeIdsKey = selectedMealTypeIds.join(',');
  useEffect(() => {
    patchDraft({
      planType,
      totalBudget: Number.isFinite(totalBudget) ? totalBudget : undefined,
      mealTypeIds: mealTypeIdsKey ? mealTypeIdsKey.split(',') : [],
    });
  }, [planType, totalBudget, mealTypeIdsKey]);

  /**
   * The same arithmetic the API will run when it creates the plan — inclusive
   * day count over the same date range — so the per-meal figure previewed here
   * matches the one the dashboard shows minutes later.
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
   * by 4x is exactly the kind of drift "Honest money UI" rules out.
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
    // rather than letting the final Launch click fail with a 400.
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

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    // Expose only what components need — not the raw form instance
    handleSubmit: form.handleSubmit,
    trigger: form.trigger,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,

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
