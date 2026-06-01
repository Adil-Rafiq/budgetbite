import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreatePlan } from '@/app/plans/_hooks/use-create-plan';
import { CreatePlanProvider } from '@/app/plans/_context/create-plan-context';
import { StepBudgetDetails } from '@/app/plans/_components/create-plan/steps/step-budget';
import { StepNotifications } from '@/app/plans/_components/create-plan/steps/step-notification';
import { StepPreview } from '@/app/plans/_components/create-plan/steps/step-preview';
import { Pill } from '@/components/ui/pill';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  replaceActivePlanId?: string | null;
};

export function CreatePlanDialog({ open, onOpenChange, replaceActivePlanId = null }: Props) {
  const createPlan = useCreatePlan(replaceActivePlanId, {
    onSuccess: () => onOpenChange(false),
  });
  const { currentStep, currentStepData, progress, isLastStep, isSubmitting, canAdvance, actions } =
    createPlan;
  const stepNumber = String(currentStep + 1).padStart(2, '0');

  return (
    <CreatePlanProvider value={createPlan}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div
              className="text-[10px] uppercase text-fathom"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              step {stepNumber} · /new-plan
            </div>
            <DialogTitle
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {currentStepData?.title}
            </DialogTitle>
            <DialogDescription className="text-ink">
              {currentStepData?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-lumen-dk">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--color-fathom), var(--color-vast))',
              }}
            />
          </div>

          {currentStep === 0 && <StepBudgetDetails />}
          {currentStep === 1 && <StepNotifications />}
          {currentStep === 2 && <StepPreview />}

          <DialogFooter>
            {currentStep > 0 && (
              <Pill variant="ghost" size="sm" onClick={actions.handleBack} disabled={isSubmitting}>
                ← back
              </Pill>
            )}
            <Pill
              size="sm"
              onClick={isLastStep ? actions.handleSubmit : actions.handleNext}
              disabled={isSubmitting || !canAdvance}
            >
              {isLastStep ? (isSubmitting ? 'Creating…' : 'Create plan') : 'Next'}
              <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                {isLastStep ? '↵' : '→'}
              </span>
            </Pill>
          </DialogFooter>

          <p
            className="mt-1 text-center text-[10px] text-soft"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
          >
            you can change every value later.
          </p>
        </DialogContent>
      </Dialog>
    </CreatePlanProvider>
  );
}
