'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMachine } from '@xstate/react';
import { planDateRange } from '@repo/shared';
import { useUpdateProfile, useUser } from '@/hooks/use-user';
import { useCreateBudgetPlan } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { showToast } from '@/lib/toast';
import { ONBOARDING_STEPS } from '@/app/onboarding/constants';
import { onboardingMachine } from '@/app/onboarding/_machines/onboarding.machine';
import { useLocationStep } from '@/app/onboarding/_hooks/use-location-step';
import { useDietaryStep } from '@/app/onboarding/_hooks/use-dietary-step';
import { useBudgetStep } from '@/app/onboarding/_hooks/use-budget-step';
import { useNotificationStep } from '@/app/onboarding/_hooks/use-notification-step';
import { clearDraft } from '@/app/onboarding/_lib/draft-storage';
import { getErrorMessage, isPlanAlreadyActive } from '@/lib/api/errors';

export type MealTypesStatus = 'loading' | 'error' | 'empty' | 'ready';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Step ids in order; doubles as the `?step=` URL vocabulary. */
const STEP_IDS: readonly string[] = ONBOARDING_STEPS.map((step) => step.id);

const BUDGET_STEP_INDEX = STEP_IDS.indexOf('budget');
const NOTIFICATIONS_STEP_INDEX = STEP_IDS.indexOf('notifications');

const stepIndexFromLocation = (): number => {
  if (typeof window === 'undefined') return 0;
  const requested = new URLSearchParams(window.location.search).get('step');
  const index = requested ? STEP_IDS.indexOf(requested) : -1;
  return index < 0 ? 0 : index;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useOnboarding = () => {
  const router = useRouter();

  // ─── Data dependencies ──────────────────────────────────────────────────

  const sessionQuery = useUser();
  const session = sessionQuery.data;
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { mutateAsync: createBudgetPlan } = useCreateBudgetPlan();
  const mealTypesQuery = useListActiveMealTypes();
  const activeMealTypes = mealTypesQuery.data ?? [];

  const mealTypesStatus: MealTypesStatus = mealTypesQuery.isLoading
    ? 'loading'
    : mealTypesQuery.isError
      ? 'error'
      : activeMealTypes.length === 0
        ? 'empty'
        : 'ready';

  // One toast per error transition. Retries that fail will toast again.
  useEffect(() => {
    if (mealTypesStatus === 'error') {
      showToast.error({
        title: 'Could not load meal types',
        description: 'Try again, or come back in a moment.',
      });
    }
  }, [mealTypesStatus]);

  // ─── Step hooks ─────────────────────────────────────────────────────────

  const locationStep = useLocationStep(session?.profile);
  const dietaryStep = useDietaryStep(session?.profile);
  const budgetStep = useBudgetStep(activeMealTypes);
  const notificationStep = useNotificationStep(
    budgetStep.values.selectedMealTypeIds,
    budgetStep.mealTypeOptions,
  );

  // ─── State machine ──────────────────────────────────────────────────────

  const [machineState, send] = useMachine(onboardingMachine);
  const currentStep = machineState.context.step;
  const isSubmittingLocation = machineState.value === 'submittingLocation';
  const isSubmittingDietary = machineState.value === 'submittingDietary';
  const isSubmittingFinish = machineState.value === 'submittingFinish';

  // ─── Step ↔ URL sync ────────────────────────────────────────────────────
  //
  // The step used to live only in machine context, so a refresh restarted the
  // flow at step 0 and the browser/OS back gesture threw the user clear out of
  // onboarding. Mirroring it into `?step=` makes Back walk the wizard and
  // survives a reload. Native history is used rather than the Next router so
  // these writes never trigger a re-render loop against the effect below.

  const restoredFromUrl = useRef(false);
  const hasWrittenUrl = useRef(false);

  useEffect(() => {
    if (restoredFromUrl.current || sessionQuery.isPending) return;
    restoredFromUrl.current = true;

    const requested = stepIndexFromLocation();
    if (requested <= 0) return;

    // Never restore past the location step unless a location is actually saved.
    // A stale link must not skip the one step everything else depends on.
    const profile = sessionQuery.data?.profile;
    if (profile?.latitude == null || profile?.longitude == null) return;

    send({ type: 'GOTO_STEP', step: requested });
  }, [sessionQuery.isPending, sessionQuery.data, send]);

  useEffect(() => {
    const id = STEP_IDS[currentStep];
    if (!id || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('step') === id) {
      hasWrittenUrl.current = true;
      return;
    }
    params.set('step', id);
    const url = `${window.location.pathname}?${params.toString()}`;

    // The first write only labels the entry the user is already on; pushing it
    // would put a dead history entry behind step 1.
    if (hasWrittenUrl.current) {
      window.history.pushState(null, '', url);
    } else {
      window.history.replaceState(null, '', url);
      hasWrittenUrl.current = true;
    }
  }, [currentStep]);

  useEffect(() => {
    const handlePopState = () => send({ type: 'GOTO_STEP', step: stepIndexFromLocation() });
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [send]);

  // ─── Derived values ─────────────────────────────────────────────────────

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isSubmitting = isSubmittingLocation || isSubmittingDietary || isSubmittingFinish;

  // What blocks the primary action on this step, if anything. Step 0 gates on a
  // real location pick — the map's opening view is not an answer.
  const blockedReason: string | null =
    currentStep === 0 && !locationStep.state.hasPickedLocation
      ? 'Pick your location to continue'
      : currentStep >= BUDGET_STEP_INDEX && mealTypesStatus !== 'ready'
        ? 'Waiting for meal types to load'
        : currentStep >= BUDGET_STEP_INDEX && !budgetStep.isComplete
          ? 'Set a budget and at least one meal to continue'
          : null;

  const canAdvance = blockedReason === null;

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
        description: getErrorMessage(err, 'Something went wrong'),
      });
    }
  });

  const handleDietarySubmit = dietaryStep.handleSubmit(async (values) => {
    send({ type: 'START_DIETARY_SUBMIT' });
    try {
      await updateProfile(values);
      send({ type: 'DIETARY_SUBMIT_SUCCESS' });
    } catch (err) {
      send({ type: 'DIETARY_SUBMIT_FAILURE' });
      showToast.error({
        title: 'Failed to save dietary preferences',
        description: getErrorMessage(err, 'Something went wrong'),
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
      // Take the user to the screen that needs fixing instead of leaving them
      // on the review step reading about a field they cannot see.
      send({
        type: 'GOTO_STEP',
        step: !isBudgetValid ? BUDGET_STEP_INDEX : NOTIFICATIONS_STEP_INDEX,
      });
      showToast.error({
        title: 'A few details need fixing',
        description: !isBudgetValid
          ? 'Check your budget and meal selection.'
          : 'Set a reminder time for each meal.',
      });
      return;
    }

    send({ type: 'START_FINISH_SUBMIT' });

    await budgetStep.handleSubmit(async (budget) => {
      await notificationStep.handleSubmit(async ({ notificationSlots }) => {
        try {
          await createBudgetPlan({
            ...budget,
            mealsPerDay: budget.mealTypeIds.length,
            ...planDateRange(budget.planType),
            notificationTimes: notificationSlots.map((slot) => ({
              time: slot.time,
              enabled: slot.enabled,
            })),
          });

          send({ type: 'FINISH_SUBMIT_SUCCESS' });
          clearDraft();
          showToast.success({
            title: 'Your plan is live',
            description: `${budget.mealTypeIds.length} meals a day, inside your budget.`,
          });
          router.push('/dashboard');
        } catch (err) {
          // A plan already exists (another tab, or a half-finished earlier run).
          // `/plans` has always handled this; onboarding used to dead-end here,
          // stranding anyone sent back to finish adding their location.
          const active = await isPlanAlreadyActive(err);
          if (active) {
            send({ type: 'FINISH_SUBMIT_SUCCESS' });
            clearDraft();
            showToast.info({
              title: 'You already have an active plan',
              description: 'Taking you to it — your profile changes are saved.',
            });
            router.push('/dashboard');
            return;
          }

          send({ type: 'FINISH_SUBMIT_FAILURE' });
          showToast.error({
            title: 'Failed to finish onboarding',
            description: getErrorMessage(err, 'Something went wrong. Please try again.'),
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
    if (currentStep === 1) {
      await handleDietarySubmit();
      return;
    }
    send({ type: 'CONTINUE' });
  };

  const handleBack = () => send({ type: 'BACK' });

  const goToStep = useCallback((step: number) => send({ type: 'GOTO_STEP', step }), [send]);

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    currentStep,
    currentStepData,
    isLastStep,
    isSubmitting,
    canAdvance,
    blockedReason,

    mealTypes: {
      status: mealTypesStatus,
      refetch: () => {
        void mealTypesQuery.refetch();
      },
    },

    steps: {
      location: locationStep,
      dietary: dietaryStep,
      budget: budgetStep,
      notifications: notificationStep,
    },

    actions: {
      handleContinue,
      handleBack,
      handleFinish,
      goToStep,
    },
  };
};
