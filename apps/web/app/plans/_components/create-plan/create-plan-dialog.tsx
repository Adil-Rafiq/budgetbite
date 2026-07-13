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
            <div className="text-xs font-semibold uppercase tracking-widest text-green">
              Step {stepNumber} · New plan
            </div>
            <DialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              {currentStepData?.title}
            </DialogTitle>
            <DialogDescription className="text-slate">
              {currentStepData?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sage/50">
            <div
              className="h-full rounded-full bg-green transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {currentStep === 0 && <StepBudgetDetails />}
          {currentStep === 1 && <StepNotifications />}
          {currentStep === 2 && <StepPreview />}

          <DialogFooter>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={actions.handleBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sage bg-white px-4 py-2 text-sm font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={isLastStep ? actions.handleSubmit : actions.handleNext}
              disabled={isSubmitting || !canAdvance}
              className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50"
            >
              {isLastStep ? (isSubmitting ? 'Creating…' : 'Create plan') : 'Next'}
              <span className="opacity-70">{isLastStep ? '↵' : '→'}</span>
            </button>
          </DialogFooter>

          <p className="mt-1 text-center text-[11px] text-slate/60">
            You can change every value later.
          </p>
        </DialogContent>
      </Dialog>
    </CreatePlanProvider>
  );
}
