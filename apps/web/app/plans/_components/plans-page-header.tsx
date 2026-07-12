'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
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

export function PlansPageHeader() {
  const [open, setOpen] = useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const { data: active } = useActiveBudgetPlan();

  const handleNewPlanClick = () => {
    if (active?.plan) {
      setReplaceTargetId(active.plan.id);
      setConfirmReplaceOpen(true);
    } else {
      setReplaceTargetId(null);
      setOpen(true);
    }
  };

  const handleConfirmReplace = () => {
    setConfirmReplaceOpen(false);
    setOpen(true);
  };

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-green">
            Budgets · Your plans
          </div>
          <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
            Budget plans.
          </h1>
          <p className="max-w-[540px] text-sm text-slate">
            Past and present — at a glance.
            <span className="ml-1.5 text-[12px] text-slate/60">One active at a time.</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewPlanClick}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-green px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-dark-green sm:self-auto"
        >
          New plan
          <Plus className="h-4 w-4" />
        </button>
      </header>

      <CreatePlanDialog open={open} onOpenChange={setOpen} replaceActivePlanId={replaceTargetId} />

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="text-xs font-semibold uppercase tracking-widest text-tomato">
              Confirm · Replace
            </div>
            <AlertDialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              Replace active plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate">
              You already have an active plan. Cancel it and start a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border border-sage bg-white px-4 py-2 text-[13px] font-medium text-slate transition-colors hover:bg-canvas active:scale-[0.97]">
              Keep current plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReplace}
              className="rounded-xl bg-green px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-dark-green active:scale-[0.97]"
            >
              Replace plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
