'use client';

import { useMachine } from '@xstate/react';
import { useCreateBudgetPlan } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { showToast } from '@/lib/toast';
import { CREATE_PLAN_STEPS } from '@/app/plans/constants';
import { createBudgetPlanMachine } from '@/app/plans/_machines/create-budget-plan.machine';
import { useBudgetStep } from '@/app/plans/_hooks/use-budget-step';
import { useNotificationStep } from '@/app/plans/_hooks/use-notification-step';
import type { BudgetPlanPreferencesInput } from '@/app/plans/types';
import { getErrorMessage } from '@/lib/api/errors';

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

export const useCreatePlan = () => {
  // ─── Data dependencies ──────────────────────────────────────────────────

  const { mutateAsync: createBudgetPlan } = useCreateBudgetPlan();
  const { data: activeMealTypes = [] } = useListActiveMealTypes();

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

      await createBudgetPlan({
        ...budget,
        mealsPerDay: budget.mealTypeIds.length,
        ...getPlanDateRange(budget.planType),
        notificationTimes: notificationSlots.map((s) => s.time),
      });

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
