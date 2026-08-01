'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMachine } from '@xstate/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCancelBudgetPlan, useCreateBudgetPlan } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { showToast } from '@/lib/toast';
import { clearPlansDraft } from '@/app/(app)/plans/_lib/draft';
import { CREATE_PLAN_STEPS } from '@/app/(app)/plans/constants';
import { createBudgetPlanMachine } from '@/app/(app)/plans/_machines/create-budget-plan.machine';
import { useBudgetStep } from '@/app/(app)/plans/_hooks/use-budget-step';
import { useNotificationStep } from '@/app/(app)/plans/_hooks/use-notification-step';
import { planDateRange } from '@repo/shared';
import { getErrorMessage, isPlanAlreadyActive } from '@/lib/api/errors';

export type MealTypesStatus = 'loading' | 'error' | 'empty' | 'ready';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Re-exported from `@repo/shared` so this flow, onboarding, and the API all
 * derive plan dates from one implementation. Three local copies is how the
 * preview screens ended up dividing by a different day count than the plan the
 * server actually stored.
 */
export const getPlanDateRange = planDateRange;

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseCreatePlanOptions {
  onSuccess?: () => void;
}

export const useCreatePlan = (
  replaceActivePlanId: string | null = null,
  { onSuccess }: UseCreatePlanOptions = {},
) => {
  // ─── Data dependencies ──────────────────────────────────────────────────

  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: createBudgetPlan } = useCreateBudgetPlan();
  const { mutateAsync: cancelBudgetPlan } = useCancelBudgetPlan();
  const mealTypesQuery = useListActiveMealTypes();
  const activeMealTypes = mealTypesQuery.data ?? [];

  const mealTypesStatus: MealTypesStatus = mealTypesQuery.isLoading
    ? 'loading'
    : mealTypesQuery.isError
      ? 'error'
      : activeMealTypes.length === 0
        ? 'empty'
        : 'ready';

  // One toast per error transition. Retries that also fail will toast again.
  useEffect(() => {
    if (mealTypesStatus === 'error') {
      showToast.error({
        title: 'Could not load meal types',
        description: 'Try again, or come back in a moment.',
      });
    }
  }, [mealTypesStatus]);

  // ─── Step hooks ─────────────────────────────────────────────────────────

  const budgetStep = useBudgetStep(activeMealTypes);
  const notificationStep = useNotificationStep(
    budgetStep.values.selectedMealTypeIds,
    budgetStep.mealTypeOptions,
  );

  // ─── State machine ──────────────────────────────────────────────────────

  const [machineState, send] = useMachine(createBudgetPlanMachine);
  const currentStep = machineState.context.step;
  const isSubmitting = machineState.value === 'submitting';

  // ─── Derived values ─────────────────────────────────────────────────────

  const progress = ((currentStep + 1) / CREATE_PLAN_STEPS.length) * 100;
  const currentStepData = CREATE_PLAN_STEPS[currentStep];
  const isLastStep = currentStep === CREATE_PLAN_STEPS.length - 1;

  /**
   * Both steps depend on meal types — and the current step must actually be
   * satisfiable. Gating on data-load alone left a fully enabled green "Next"
   * that ran validation, failed, and returned without moving or saying
   * anything. A disabled button is honest about a blocked step; an enabled one
   * that does nothing reads as a broken app.
   */
  const stepIsSatisfied =
    currentStep === 0
      ? budgetStep.isComplete
      : currentStep === 1
        ? notificationStep.values.slots.every((slot) => /^\d{2}:\d{2}$/.test(slot.time))
        : true;

  const canAdvance = mealTypesStatus === 'ready' && stepIsSatisfied;

  // ─── Step handlers ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const [isBudgetValid, isNotificationsValid] = await Promise.all([
      budgetStep.trigger(),
      notificationStep.trigger(),
    ]);

    if (!isBudgetValid || !isNotificationsValid) return;

    send({ type: 'START_SUBMIT' });

    // Tracks whether we have already cancelled the old plan, so a failure
    // afterwards can say so. The cancel has to happen first — the partial
    // unique index permits only one active plan — but that leaves a window
    // where a failed create drops the user to no active plan at all. There is
    // no client-side transaction to close it; the least we owe them is an
    // error that names what actually happened instead of "try again".
    let cancelledPriorPlan = false;

    try {
      const budget = budgetStep.getValues();
      const { notificationSlots } = notificationStep.getValues();

      // Replace flow: cancel the prior active plan first. The user already
      // confirmed in the AlertDialog upstream; the partial unique index on
      // budget_plan still backstops any race that bypasses this UX.
      if (replaceActivePlanId) {
        await cancelBudgetPlan(replaceActivePlanId);
        cancelledPriorPlan = true;
      }

      let created: Awaited<ReturnType<typeof createBudgetPlan>>;
      try {
        created = await createBudgetPlan({
          ...budget,
          mealsPerDay: budget.mealTypeIds.length,
          ...getPlanDateRange(budget.planType),
          notificationTimes: notificationSlots.map((s) => ({ time: s.time, enabled: s.enabled })),
        });
      } catch (err) {
        // Race fallback: another tab created an active plan between our
        // pre-check and our create. Surface a recoverable toast and refresh
        // the active-plan cache so the next "New Plan" click sees fresh state.
        const conflict = await isPlanAlreadyActive(err);
        if (conflict) {
          queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
          queryClient.invalidateQueries({ queryKey: ['budgetPlans'] });
          send({ type: 'SUBMIT_FAILURE' });
          showToast.error({
            title: 'Active plan detected',
            description:
              'Another active plan was created. Refresh and try again from the plans page.',
          });
          return;
        }
        throw err;
      }

      send({ type: 'SUBMIT_SUCCESS' });
      clearPlansDraft();
      showToast.success({
        title: 'Budget plan created',
        description: 'Generate suggestions to fill the period.',
      });
      onSuccess?.();

      // Land on the plan, not back on the list. Committing a month of food
      // money used to resolve into a 3-second toast and one more grey card,
      // with nothing generated and no hint that generating was the next step —
      // the emptiest possible ending to the highest-stakes action here.
      // `useStartNextPlan` already navigated; the primary path now matches it.
      if (created?.id) router.push(`/plans/${created.id}`);
    } catch (err) {
      send({ type: 'SUBMIT_FAILURE' });
      queryClient.invalidateQueries({ queryKey: ['activeBudgetPlan'] });
      queryClient.invalidateQueries({ queryKey: ['budgetPlans'] });
      showToast.error({
        title: 'Failed to create budget plan',
        description: cancelledPriorPlan
          ? 'Your previous plan was already cancelled, so you have no active plan right now. Your details are still here — press Create plan to try again.'
          : getErrorMessage(err, 'Something went wrong. Please try again.'),
      });
    }
  };

  // ─── Navigation ──────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (currentStep === 0) {
      const valid = await budgetStep.trigger();
      if (!valid) return;
    }
    if (currentStep === 1) {
      const valid = await notificationStep.trigger();
      if (!valid) return;
    }
    send({ type: 'NEXT' });
  };

  const handleBack = () => send({ type: 'BACK' });

  /**
   * Return the whole flow to step one with empty forms. Called when the dialog
   * opens, so "New plan" always means a new plan.
   *
   * Depends on the two `reset` functions rather than the step objects: those
   * objects are rebuilt every render, and the dialog runs this from an effect —
   * an unstable identity there would re-reset on every render forever.
   */
  const resetBudgetStep = budgetStep.reset;
  const resetNotificationStep = notificationStep.reset;

  const reset = useCallback(() => {
    send({ type: 'RESET' });
    resetBudgetStep();
    resetNotificationStep();
  }, [send, resetBudgetStep, resetNotificationStep]);

  /** Explicit discard: throw the draft away too, then start clean. */
  const discard = useCallback(() => {
    clearPlansDraft();
    reset();
  }, [reset]);

  /** True once the user has typed anything worth warning them about losing. */
  const isDirty = budgetStep.isDirty || notificationStep.isDirty;

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    currentStep,
    progress,
    currentStepData,
    isLastStep,
    isSubmitting,
    canAdvance,
    isDirty,
    reset,
    discard,

    mealTypes: {
      status: mealTypesStatus,
      refetch: () => {
        void mealTypesQuery.refetch();
      },
    },

    steps: {
      budget: budgetStep,
      notifications: notificationStep,
    },

    actions: {
      handleNext,
      handleBack,
      handleSubmit,
    },
  };
};
