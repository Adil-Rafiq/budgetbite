'use client';

import { useOnboarding } from '@/app/onboarding/_hooks/use-onboarding';
import { OnboardingShell } from '@/app/onboarding/_components/onboarding-shell';
import { LocationStep } from '@/app/onboarding/_components/steps/location-step';
import { DietaryStep } from '@/app/onboarding/_components/steps/dietary-step';
import { BudgetStep } from '@/app/onboarding/_components/steps/budget-step';
import { NotificationsStep } from '@/app/onboarding/_components/steps/notifications-step';
import { ReviewStep } from '@/app/onboarding/_components/steps/review-step';
import { OnboardingProvider } from '@/app/onboarding/_context/onboarding-context';
import type { OnboardingStepId } from '@/app/onboarding/types';

/**
 * Keyed by step id rather than index so adding or reordering a step in
 * ONBOARDING_STEPS cannot silently render the wrong screen.
 */
const STEP_COMPONENTS: Record<OnboardingStepId, () => React.JSX.Element> = {
  location: LocationStep,
  dietary: DietaryStep,
  budget: BudgetStep,
  notifications: NotificationsStep,
  review: ReviewStep,
};

export default function OnboardingPage() {
  const onboarding = useOnboarding();
  const { currentStepData } = onboarding;

  // The shell owns the "unknown step" guard; bail here only so the lookup below
  // has a step id to work with.
  if (!currentStepData) return null;

  const StepComponent = STEP_COMPONENTS[currentStepData.id];

  return (
    <OnboardingProvider value={onboarding}>
      <OnboardingShell>
        <StepComponent />
      </OnboardingShell>
    </OnboardingProvider>
  );
}
