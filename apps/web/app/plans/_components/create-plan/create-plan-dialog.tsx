import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreatePlan } from '@/app/plans/_hooks/use-create-plan';
import { CreatePlanProvider } from '@/app/plans/_context/create-plan-context';
import { Progress } from '@/components/ui/progress';
import { StepBudgetDetails } from '@/app/plans/_components/create-plan/steps/step-budget';
import { StepNotifications } from '@/app/plans/_components/create-plan/steps/step-notification';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function CreatePlanDialog({ open, onOpenChange }: Props) {
  const createPlan = useCreatePlan();
  const { currentStep, currentStepData, progress, isLastStep, isSubmitting, actions } = createPlan;

  return (
    <CreatePlanProvider value={createPlan}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{currentStepData?.title}</DialogTitle>
            <DialogDescription>{currentStepData?.description}</DialogDescription>
          </DialogHeader>

          <Progress value={progress} className="w-full max-w-xs mt-4 h-2" />

          {currentStep === 0 && <StepBudgetDetails />}
          {currentStep === 1 && <StepNotifications />}

          <DialogFooter>
            {currentStep > 0 && (
              <Button variant="outline" onClick={actions.handleBack} disabled={isSubmitting}>
                Back
              </Button>
            )}
            <Button
              onClick={isLastStep ? actions.handleSubmit : actions.handleNext}
              disabled={isSubmitting}
            >
              {isLastStep ? (isSubmitting ? 'Creating...' : 'Create Plan') : 'Next'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CreatePlanProvider>
  );
}
