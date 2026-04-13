'use client';

import { ArrowLeft, ArrowRight, Loader2, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOnboardingContext } from '@/app/onboarding/_context/onboarding-context';
import { ONBOARDING_STEPS } from '@/app/onboarding/constants';

interface OnboardingShellProps {
  children: React.ReactNode;
}

export const OnboardingShell = ({ children }: OnboardingShellProps) => {
  const {
    currentStep,
    progress,
    currentStepData,
    actions: { handleContinue, handleBack, handleFinish },
    isLastStep,
    isSubmitting,
  } = useOnboardingContext();

  if (!currentStepData) return null;
  const StepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary mb-4">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set up BudgetBite</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>
          <Progress value={progress} className="w-full max-w-xs mt-4 h-2" />
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <StepIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg text-card-foreground">
                  {currentStepData.title}
                </CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {!isLastStep ? (
            <Button type="button" onClick={handleContinue} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 ml-1" />
              )}
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={handleFinish} disabled={isSubmitting}>
              Finish setup
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
