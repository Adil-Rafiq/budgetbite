'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your current and past food budgets.
          </p>
        </div>
        <Button onClick={handleNewPlanClick}>
          <Plus className="w-4 h-4 mr-1" />
          New Plan
        </Button>
      </div>

      <CreatePlanDialog
        open={open}
        onOpenChange={setOpen}
        replaceActivePlanId={replaceTargetId}
      />

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace active plan?</AlertDialogTitle>
            <AlertDialogDescription>
              You already have an active plan running. Cancel it and start a new one? Your existing
              suggestions and choices will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current plan</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Cancel & create new
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
