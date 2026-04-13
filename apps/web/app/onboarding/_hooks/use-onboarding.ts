'use client';

import { useRouter } from 'next/navigation';
import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { useCreateBudgetPlan } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { showToast } from '@/lib/toast';
import { ONBOARDING_STEPS } from '@/app/onboarding/constants';
import type { BudgetPlanPreferencesInput } from '@/app/onboarding/types';
import { useSaveNotificationPreferences } from '@/app/onboarding/_hooks/use-save-notification-preferences';
import { onboardingMachine } from '@/app/onboarding/_machines/onboarding.machine';
import { useMachine } from '@xstate/react';
import { useLocationStep } from '@/app/onboarding/_hooks/use-location-step';
import { useBudgetStep } from '@/app/onboarding/_hooks/use-budget-step';
import { useNotificationStep } from '@/app/onboarding/_hooks/use-notification-step';

const getPlanDateRange = (planType: BudgetPlanPreferencesInput['planType']) => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (planType === 'weekly') {
    endDate.setDate(endDate.getDate() + 7);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return {
    startDate: startDate.toISOString().split('T')[0] ?? startDate.toISOString(),
    endDate: endDate.toISOString().split('T')[0] ?? endDate.toISOString(),
  };
};

export const useOnboarding = () => {
  const router = useRouter();
  const { data: session } = useUser();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { mutateAsync: createBudgetPlan } = useCreateBudgetPlan();
  const { mutateAsync: saveNotificationPreferences } = useSaveNotificationPreferences();
  const { data: activeMealTypes = [] } = useListActiveMealTypes();

  const locationStep = useLocationStep(session?.profile);
  const budgetStep = useBudgetStep(activeMealTypes);
  const notificationStep = useNotificationStep(
    budgetStep.values.selectedMealTypeIds,
    budgetStep.mealTypeOptions,
  );

  const [machineState, send] = useMachine(onboardingMachine);
  const currentStep = machineState.context.step;
  const currentMachineState = machineState.value;
  const isSubmittingLocation = currentMachineState === 'submittingLocation';
  const isSubmittingFinish = currentMachineState === 'submittingFinish';

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const currentStepData = ONBOARDING_STEPS[currentStep];

  const handleContinue = async () => {
    if (currentStep === 0) {
      send({ type: 'START_LOCATION_SUBMIT' });
      const isLocationValid = await locationStep.form.trigger();

      if (!isLocationValid) {
        send({ type: 'LOCATION_SUBMIT_FAILURE' });
        return;
      }

      try {
        await updateProfile(locationStep.form.getValues());
        send({ type: 'LOCATION_SUBMIT_SUCCESS' });
      } catch (err) {
        send({ type: 'LOCATION_SUBMIT_FAILURE' });
        showToast.error({
          title: 'Failed to save location',
          description: err instanceof Error ? err.message : 'Something went wrong',
        });
      }
      return;
    }

    send({ type: 'CONTINUE' });
  };

  const handleBack = () => send({ type: 'BACK' });

  const handleFinish = async () => {
    send({ type: 'START_FINISH_SUBMIT' });

    const [isBudgetValid, isNotificationsValid] = await Promise.all([
      budgetStep.form.trigger(),
      notificationStep.form.trigger(),
    ]);

    if (!isBudgetValid || !isNotificationsValid) {
      send({ type: 'FINISH_SUBMIT_FAILURE' });
      return;
    }

    try {
      const budget = budgetStep.form.getValues();
      const notificationSlots = notificationStep.form.getValues('notificationSlots');
      const notificationTimes = notificationSlots.map((slot) => slot.time);
      const dateRange = getPlanDateRange(budget.planType);

      await createBudgetPlan({
        ...budget,
        ...dateRange,
        notificationTimes,
      });

      await saveNotificationPreferences({ notificationSlots });

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
  };

  return {
    currentStep,
    progress,
    currentStepData,
    steps: {
      location: locationStep,
      budget: budgetStep,
      notifications: notificationStep,
    },
    handleContinue,
    handleBack,
    handleFinish,
    isLastStep: currentStep === ONBOARDING_STEPS.length - 1,
    isSubmitting: isSubmittingLocation || isSubmittingFinish,
  };
};
