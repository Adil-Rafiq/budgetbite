'use client';

import { useRouter } from 'next/navigation';
import { useMachine } from '@xstate/react';
import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { useCreateBudgetPlan } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { showToast } from '@/lib/toast';
import { ONBOARDING_STEPS } from '@/app/onboarding/constants';
import { onboardingMachine } from '@/app/onboarding/_machines/onboarding.machine';
import { useLocationStep } from '@/app/onboarding/_hooks/use-location-step';
import { useBudgetStep } from '@/app/onboarding/_hooks/use-budget-step';
import { useNotificationStep } from '@/app/onboarding/_hooks/use-notification-step';
import type { BudgetPlanPreferencesInput } from '@/app/onboarding/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPlanDateRange = (planType: BudgetPlanPreferencesInput['planType']) => {
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (planType === 'weekly') {
    endDate.setDate(endDate.getDate() + 7);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const toDateString = (d: Date) => d.toISOString().split('T')[0] ?? d.toISOString();

  return {
    startDate: toDateString(startDate),
    endDate: toDateString(endDate),
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useOnboarding = () => {
  const router = useRouter();

  // ─── Data dependencies ──────────────────────────────────────────────────

  const { data: session } = useUser();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { mutateAsync: createBudgetPlan } = useCreateBudgetPlan();
  const { data: activeMealTypes = [] } = useListActiveMealTypes();

  // ─── Step hooks ─────────────────────────────────────────────────────────

  const locationStep = useLocationStep(session?.profile);
  const budgetStep = useBudgetStep(activeMealTypes);
  const notificationStep = useNotificationStep(
    budgetStep.values.selectedMealTypeIds,
    budgetStep.mealTypeOptions,
  );

  // ─── State machine ──────────────────────────────────────────────────────

  const [machineState, send] = useMachine(onboardingMachine);
  const currentStep = machineState.context.step;
  const isSubmittingLocation = machineState.value === 'submittingLocation';
  const isSubmittingFinish = machineState.value === 'submittingFinish';

  // ─── Derived values ─────────────────────────────────────────────────────

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isSubmitting = isSubmittingLocation || isSubmittingFinish;

  // ─── Step handlers ───────────────────────────────────────────────────────

  const handleLocationSubmit = locationStep.handleSubmit(async (values) => {
    send({ type: 'START_LOCATION_SUBMIT' });
    try {
      await updateProfile(values);
      send({ type: 'LOCATION_SUBMIT_SUCCESS' });
    } catch (err) {
      send({ type: 'LOCATION_SUBMIT_FAILURE' });
      showToast.error({
        title: 'Failed to save location',
        description: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  });

  const handleFinish = async () => {
    // Validate both forms before submitting
    const [isBudgetValid, isNotificationsValid] = await Promise.all([
      budgetStep.trigger(),
      notificationStep.trigger(),
    ]);

    if (!isBudgetValid || !isNotificationsValid) {
      send({ type: 'FINISH_SUBMIT_FAILURE' });
      return;
    }

    send({ type: 'START_FINISH_SUBMIT' });

    await budgetStep.handleSubmit(async (budget) => {
      await notificationStep.handleSubmit(async ({ notificationSlots }) => {
        try {
          await createBudgetPlan({
            ...budget,
            mealsPerDay: budget.mealTypeIds.length,
            ...getPlanDateRange(budget.planType),
            notificationTimes: notificationSlots.map((slot) => slot.time),
          });

          send({ type: 'FINISH_SUBMIT_SUCCESS' });
          showToast.success({ title: 'Setup complete!', description: 'Welcome to BudgetBite.' });
          router.push('/dashboard');
        } catch (err) {
          send({ type: 'FINISH_SUBMIT_FAILURE' });
          showToast.error({
            title: 'Failed to finish onboarding',
            description: err instanceof Error ? err.message : 'Please try again.',
          });
        }
      })();
    })();
  };

  // ─── Navigation ──────────────────────────────────────────────────────────

  const handleContinue = async () => {
    if (currentStep === 0) {
      await handleLocationSubmit();
      return;
    }
    send({ type: 'CONTINUE' });
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
      location: locationStep,
      budget: budgetStep,
      notifications: notificationStep,
    },

    actions: {
      handleContinue,
      handleBack,
      handleFinish,
    },
  };
};
