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
import { Pill } from '@/components/ui/pill';

const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const MUTED = '#71716a';
const SOFT = '#a6a691';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * When set, the submit flow cancels this plan first, then creates the new
   * one. Drives the "Cancel & create new" replace UX from PlansPageHeader.
   */
  replaceActivePlanId?: string | null;
};

export function CreatePlanDialog({ open, onOpenChange, replaceActivePlanId = null }: Props) {
  const createPlan = useCreatePlan(replaceActivePlanId);
  const { currentStep, currentStepData, progress, isLastStep, isSubmitting, actions } = createPlan;
  const stepNumber = String(currentStep + 1).padStart(2, '0');

  return (
    <CreatePlanProvider value={createPlan}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div
              className="text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
            >
              step {stepNumber} · /new-plan
            </div>
            <DialogTitle
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: VAST,
              }}
            >
              {currentStepData?.title}
            </DialogTitle>
            <DialogDescription style={{ color: MUTED }}>
              {currentStepData?.description}
            </DialogDescription>
          </DialogHeader>

          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: LUMEN_DK }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${FATHOM}, ${VAST})`,
              }}
            />
          </div>

          {currentStep === 0 && <StepBudgetDetails />}
          {currentStep === 1 && <StepNotifications />}

          <DialogFooter>
            {currentStep > 0 && (
              <Pill variant="ghost" size="sm" onClick={actions.handleBack} disabled={isSubmitting}>
                ← back
              </Pill>
            )}
            <Pill
              size="sm"
              onClick={isLastStep ? actions.handleSubmit : actions.handleNext}
              disabled={isSubmitting}
            >
              {isLastStep ? (isSubmitting ? 'Creating…' : 'Create plan') : 'Next'}
              <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                {isLastStep ? '↵' : '→'}
              </span>
            </Pill>
          </DialogFooter>

          <p
            className="mt-1 text-center text-[10px]"
            style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
          >
            you can change every value later.
          </p>
        </DialogContent>
      </Dialog>
    </CreatePlanProvider>
  );
}
