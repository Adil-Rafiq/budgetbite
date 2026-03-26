'use client';

import { ArrowLeft, ArrowRight, Loader2, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OnboardingShellProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
  stepIcon: React.ElementType;
  stepTitle: string;
  stepDescription: string;
  isLastStep: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onContinue: () => void;
  onFinish: () => void;
  children: React.ReactNode;
}

export const OnboardingShell = ({
  currentStep,
  totalSteps,
  progress,
  stepIcon: StepIcon,
  stepTitle,
  stepDescription,
  isLastStep,
  isSubmitting,
  onBack,
  onContinue,
  onFinish,
  children,
}: OnboardingShellProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
    <div className="w-full max-w-lg">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary mb-4">
          <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Set up BudgetBite</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Step {currentStep + 1} of {totalSteps}
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
              <CardTitle className="text-lg text-card-foreground">{stepTitle}</CardTitle>
              <CardDescription>{stepDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" onClick={onBack} disabled={currentStep === 0}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {!isLastStep ? (
          <Button onClick={onContinue} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 ml-1" />
            )}
            Continue
          </Button>
        ) : (
          <Button onClick={onFinish}>
            Finish setup
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  </div>
);
