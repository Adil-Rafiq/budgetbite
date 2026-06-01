'use client';

import { useState } from 'react';
import { CreatePlanDialog } from '@/app/plans/_components/create-plan/create-plan-dialog';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { Pill } from '@/components/ui/pill';
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
          <div
            className="text-[10px] uppercase text-fathom"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
          >
            budgets · /plans
          </div>
          <h1
            className="text-vast"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            Budget plans.
          </h1>
          <p className="max-w-[540px] text-[14px] text-ink">
            Past and present — at a glance.
            <span
              className="ml-1.5 text-[12px] text-soft"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              one active at a time.
            </span>
          </p>
        </div>

        <Pill size="md" onClick={handleNewPlanClick} className="self-start sm:self-auto">
          New plan
          <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>+</span>
        </Pill>
      </header>

      <CreatePlanDialog open={open} onOpenChange={setOpen} replaceActivePlanId={replaceTargetId} />

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div
              className="text-[10px] uppercase text-pulse"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              confirm · /replace
            </div>
            <AlertDialogTitle
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Replace active plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-ink">
              You already have an active plan. Cancel it and start a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-full border border-lumen-dk bg-transparent px-4 py-2 text-[13px] text-vast transition-colors hover:bg-lumen active:scale-[0.97]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Keep current plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReplace}
              className="rounded-full bg-vast px-5 py-2 text-[13px] font-medium text-lumen transition-colors hover:bg-vast/85 active:scale-[0.97]"
            >
              Replace plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
