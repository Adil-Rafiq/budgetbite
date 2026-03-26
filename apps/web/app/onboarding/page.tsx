'use client';

import { useOnboarding } from './_hooks/use-onboarding';
import { OnboardingShell } from './_components/onboarding-shell';
import { LocationStep } from './_components/steps/location-step';
import { BudgetStep } from './_components/steps/budget-step';
import { NotificationsStep } from './_components/steps/notifications-step';
import { ONBOARDING_STEPS } from './constants';

export default function OnboardingPage() {
  const {
    currentStep,
    progress,
    currentStepData,
    planType,
    setPlanType,
    mealTypes,
    notificationTimes,
    locationForm,
    toggleMealType,
    addNotificationTime,
    removeNotificationTime,
    updateNotificationTime,
    handleContinue,
    handleBack,
    handleFinish,
    isLastStep,
    isSubmitting,
  } = useOnboarding();

  if (!currentStepData) return null;

  return (
    <OnboardingShell
      currentStep={currentStep}
      totalSteps={ONBOARDING_STEPS.length}
      progress={progress}
      stepIcon={currentStepData.icon}
      stepTitle={currentStepData.title}
      stepDescription={currentStepData.description}
      isLastStep={isLastStep}
      isSubmitting={isSubmitting}
      onBack={handleBack}
      onContinue={handleContinue}
      onFinish={handleFinish}
    >
      {currentStep === 0 && <LocationStep form={locationForm} />}
      {currentStep === 1 && (
        <BudgetStep
          planType={planType}
          setPlanType={setPlanType}
          mealTypes={mealTypes}
          toggleMealType={toggleMealType}
        />
      )}
      {currentStep === 2 && (
        <NotificationsStep
          notificationTimes={notificationTimes}
          addNotificationTime={addNotificationTime}
          removeNotificationTime={removeNotificationTime}
          updateNotificationTime={updateNotificationTime}
        />
      )}
    </OnboardingShell>
  );
}
