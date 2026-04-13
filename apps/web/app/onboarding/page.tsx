'use client';

import { useOnboarding } from '@/app/onboarding/_hooks/use-onboarding';
import { OnboardingShell } from '@/app/onboarding/_components/onboarding-shell';
import { LocationStep } from '@/app/onboarding/_components/steps/location-step';
import { BudgetStep } from '@/app/onboarding/_components/steps/budget-step';
import { NotificationsStep } from '@/app/onboarding/_components/steps/notifications-step';
import { OnboardingProvider } from '@/app/onboarding/_context/onboarding-context';

export default function OnboardingPage() {
  const onboarding = useOnboarding();
  const { currentStep, currentStepData } = onboarding;

  if (!currentStepData) return null;

  return (
    <OnboardingProvider value={onboarding}>
      <OnboardingShell>
        {currentStep === 0 && <LocationStep />}
        {currentStep === 1 && <BudgetStep />}
        {currentStep === 2 && <NotificationsStep />}
      </OnboardingShell>
    </OnboardingProvider>
  );
}
