'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { CreatePlanDialog } from '@/app/plans/_components/create-plan/create-plan-dialog';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
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
import { FOCUS_RING } from '@/lib/focus-ring';

/**
 * Owns "start a new plan" for the whole /plans route.
 *
 * The header used to own the dialog outright, which is why the empty state was
 * a dashed box reading "No plans yet. Create one to get started." with no
 * button in it — the only way to act was a small pill in the far corner. The
 * dashboard's first-run screen sends people here, so the emptiest screen in the
 * app was the one it handed them to. Hoisting the trigger lets any surface on
 * this route offer the action in the place the user is already looking.
 */

const NewPlanLauncherContext = createContext<(() => void) | null>(null);

export function NewPlanLauncher({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const { data: active } = useActiveBudgetPlan();

  const requestNewPlan = () => {
    if (active?.plan) {
      setReplaceTargetId(active.plan.id);
      setConfirmReplaceOpen(true);
    } else {
      setReplaceTargetId(null);
      setOpen(true);
    }
  };

  return (
    <NewPlanLauncherContext.Provider value={requestNewPlan}>
      {children}

      <CreatePlanDialog open={open} onOpenChange={setOpen} replaceActivePlanId={replaceTargetId} />

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="text-xs font-semibold uppercase tracking-widest text-tomato-ink">
              Confirm · Replace
            </div>
            <AlertDialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              Replace active plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate">
              You can only run one plan at a time. Starting a new one cancels the plan you have
              going now — its logged spend stays in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={`min-h-11 rounded-xl border border-sage bg-white px-4 text-[13px] font-medium text-slate transition-colors hover:bg-canvas active:scale-[0.97] ${FOCUS_RING}`}
            >
              Keep current plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmReplaceOpen(false);
                setOpen(true);
              }}
              className={`min-h-11 rounded-xl bg-green-deep px-5 text-[13px] font-semibold text-white transition-colors hover:bg-green-deeper active:scale-[0.97] ${FOCUS_RING}`}
            >
              Replace plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NewPlanLauncherContext.Provider>
  );
}

export const useNewPlanLauncher = () => {
  const requestNewPlan = useContext(NewPlanLauncherContext);
  if (!requestNewPlan) {
    throw new Error('useNewPlanLauncher must be used inside NewPlanLauncher');
  }
  return requestNewPlan;
};
