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

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const MUTED = '#71716a';
const SOFT = '#a6a691';

export function PlansPageHeader() {
  const [open, setOpen] = useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  // When set, the create dialog will cancel this plan before posting the new one.
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const { data: active } = useActiveBudgetPlan();

  // Pre-check is the happy path: when an active plan exists, warn before
  // opening the create dialog so the user doesn't fill out a form just to be
  // told mid-flow. The 409 fallback in the create hook still handles the
  // race where a plan appears between this check and submit.
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
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            budgets · /plans
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: VAST,
            }}
          >
            Budget plans.
          </h1>
          <p className="text-[14px]" style={{ color: MUTED, maxWidth: 540 }}>
            Past and present food budgets — at a glance.
            <span
              className="ml-1.5 text-[12px]"
              style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
            >
              one active at a time.
            </span>
          </p>
        </div>

        <Pill
          size="md"
          onClick={handleNewPlanClick}
          className="self-start sm:self-auto"
        >
          New plan
          <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>+</span>
        </Pill>
      </header>

      <CreatePlanDialog
        open={open}
        onOpenChange={setOpen}
        replaceActivePlanId={replaceTargetId}
      />

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div
              className="text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: PULSE, letterSpacing: '0.22em' }}
            >
              confirm · /replace
            </div>
            <AlertDialogTitle
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: VAST,
              }}
            >
              Replace active plan?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: MUTED }}>
              You already have an active plan running. Cancel it and start a new one? Your existing
              suggestions and choices will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-full px-4 py-2 text-[13px] transition-colors hover:bg-[#ffffeb] active:scale-[0.97]"
              style={{
                fontFamily: 'var(--font-mono)',
                border: `1px solid ${LUMEN_DK}`,
                background: 'transparent',
                color: VAST,
              }}
            >
              Keep current plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReplace}
              className="rounded-full px-5 py-2 text-[13px] font-medium transition-colors hover:bg-[#2a2a2a] active:scale-[0.97]"
              style={{ background: VAST, color: LUMEN }}
            >
              Cancel &amp; create new
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
