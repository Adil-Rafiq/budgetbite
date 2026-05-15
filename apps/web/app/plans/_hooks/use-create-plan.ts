'use client';

import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCancelBudgetPlan, useCreateBudgetPlan } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { showToast } from '@/lib/toast';
import { CREATE_PLAN_STEPS } from '@/app/plans/constants';
import { createBudgetPlanMachine } from '@/app/plans/_machines/create-budget-plan.machine';
import { useBudgetStep } from '@/app/plans/_hooks/use-budget-step';
import { useNotificationStep } from '@/app/plans/_hooks/use-notification-step';
import type { BudgetPlanPreferencesInput } from '@/app/plans/types';
import { getErrorMessage, isPlanAlreadyActive } from '@/lib/api/errors';

export type MealTypesStatus = 'loading' | 'error' | 'empty' | 'ready';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPlanDateRange = (planType: BudgetPlanPreferencesInput['planType']) => {
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (planType === 'weekly') {
    endDate.setDate(endDate.getDate() + 7);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const toLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: toLocalDateString(startDate),
    endDate: toLocalDateString(endDate),
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCreatePlan = (replaceActivePlanId: string | null = null) => {
  // ─── Data dependencies ──────────────────────────────────────────────────

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

  // Both steps of this dialog (budget, notifications) depend on meal types.
  const canAdvance = mealTypesStatus === 'ready';

  // ─── Step handlers ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const [isBudgetValid, isNotificationsValid] = await Promise.all([
      budgetStep.trigger(),
      notificationStep.trigger(),
    ]);

    if (!isBudgetValid || !isNotificationsValid) return;

    send({ type: 'START_SUBMIT' });

    try {
      const budget = budgetStep.getValues();
      const { notificationSlots } = notificationStep.getValues();

      // Replace flow: cancel the prior active plan first. The user already
      // confirmed in the AlertDialog upstream; the partial unique index on
      // budget_plan still backstops any race that bypasses this UX.
      if (replaceActivePlanId) {
        await cancelBudgetPlan(replaceActivePlanId);
      }

      try {
        await createBudgetPlan({
          ...budget,
          mealsPerDay: budget.mealTypeIds.length,
          ...getPlanDateRange(budget.planType),
          notificationTimes: notificationSlots.map((s) => s.time),
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
      showToast.success({ title: 'Budget plan created!', description: '...' });
    } catch (err) {
      send({ type: 'SUBMIT_FAILURE' });
      showToast.error({
        title: 'Failed to create budget plan',
        description: getErrorMessage(err, '...'),
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

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    currentStep,
    progress,
    currentStepData,
    isLastStep,
    isSubmitting,
    canAdvance,

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
