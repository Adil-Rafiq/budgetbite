'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCreatePlan } from '@/app/(app)/plans/_hooks/use-create-plan';
import { CreatePlanProvider } from '@/app/(app)/plans/_context/create-plan-context';
import { StepBudgetDetails } from '@/app/(app)/plans/_components/create-plan/steps/step-budget';
import { StepNotifications } from '@/app/(app)/plans/_components/create-plan/steps/step-notification';
import { StepPreview } from '@/app/(app)/plans/_components/create-plan/steps/step-preview';
import { FOCUS_RING } from '@/lib/focus-ring';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  replaceActivePlanId?: string | null;
};

export function CreatePlanDialog({ open, onOpenChange, replaceActivePlanId = null }: Props) {
  const createPlan = useCreatePlan(replaceActivePlanId, {
    onSuccess: () => onOpenChange(false),
  });
  const {
    currentStep,
    currentStepData,
    progress,
    isLastStep,
    isSubmitting,
    canAdvance,
    isDirty,
    reset,
    discard,
    actions,
  } = createPlan;
  const stepNumber = String(currentStep + 1).padStart(2, '0');

  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  // This component mounts unconditionally, so the hook outlives every close.
  // Resetting on open is what makes "New plan" mean a new plan rather than
  // step 3 of the one just created.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  /**
   * Esc, an overlay tap, or the X used to discard a committed money figure
   * with no warning. Ask first — but only when there is something to lose.
   */
  const requestClose = (next: boolean) => {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (isSubmitting) return;
    if (isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const advance = () => (isLastStep ? actions.handleSubmit() : actions.handleNext());

  return (
    <CreatePlanProvider value={createPlan}>
      <Dialog open={open} onOpenChange={requestClose}>
        {/* `max-h`/`overflow-y-auto`: the preview step is taller than a 667px
            phone viewport, and a centred non-scrolling box put the Create
            button off-screen with no way to reach it. */}
        <DialogContent
          className="max-h-[85dvh] max-w-md overflow-y-auto"
          onKeyDown={(event) => {
            // The footer draws a `↵` glyph. It used to be decoration: the
            // buttons are `type="button"` outside any form, so Enter did
            // nothing. Now it does what it says.
            if (event.key !== 'Enter' || event.shiftKey) return;
            const target = event.target as HTMLElement;
            if (target.tagName === 'TEXTAREA') return;
            if (target.getAttribute('role') === 'checkbox') return;
            if (!canAdvance || isSubmitting) return;
            event.preventDefault();
            void advance();
          }}
        >
          <DialogHeader>
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-deep">
              Step {stepNumber} · New plan
            </div>
            <DialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              {currentStepData?.title}
            </DialogTitle>
            <DialogDescription className="text-slate">
              {currentStepData?.description}
            </DialogDescription>
          </DialogHeader>

          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand/50"
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-label={`Step ${currentStep + 1} of 3`}
          >
            <div
              className="h-full rounded-full bg-teal transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Announce the step change to anyone who cannot see the title move. */}
          <p aria-live="polite" className="sr-only">
            Step {currentStep + 1} of 3: {currentStepData?.title}
          </p>

          {currentStep === 0 && <StepBudgetDetails />}
          {currentStep === 1 && <StepNotifications />}
          {currentStep === 2 && <StepPreview />}

          <DialogFooter>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={actions.handleBack}
                disabled={isSubmitting}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-sand bg-white px-4 text-sm font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={advance}
              disabled={isSubmitting || !canAdvance}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-deep px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-deeper disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
            >
              {isLastStep ? (isSubmitting ? 'Creating…' : 'Create plan') : 'Next'}
              <span aria-hidden className="opacity-70">
                {isLastStep ? '↵' : '→'}
              </span>
            </button>
          </DialogFooter>

          <p className="mt-1 text-center text-[11px] text-slate/60">
            Reminder times can be changed later in your profile.
          </p>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="text-xs font-semibold uppercase tracking-widest text-tomato-ink">
              Confirm · Discard
            </div>
            <AlertDialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              Discard this plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate">
              Your budget and reminder times haven&apos;t been saved yet. Close and they&apos;re
              gone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={`min-h-11 rounded-xl border border-sand bg-white px-4 text-[13px] font-medium text-slate transition-colors hover:bg-canvas active:scale-[0.97] ${FOCUS_RING}`}
            >
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscardOpen(false);
                discard();
                onOpenChange(false);
              }}
              className={`min-h-11 rounded-xl bg-tomato-ink px-5 text-[13px] font-semibold text-white transition-colors hover:bg-tomato/90 active:scale-[0.97] ${FOCUS_RING}`}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CreatePlanProvider>
  );
}
