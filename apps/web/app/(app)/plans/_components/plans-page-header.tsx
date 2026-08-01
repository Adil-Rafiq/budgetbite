'use client';

import { Plus } from 'lucide-react';
import { useNewPlanLauncher } from '@/app/(app)/plans/_context/new-plan-launcher';
import { FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';

export function PlansPageHeader() {
  const requestNewPlan = useNewPlanLauncher();

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-green-deep">
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
        onClick={requestNewPlan}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-green-deep px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-green-deeper sm:self-auto ${FOCUS_RING_ON_CANVAS}`}
      >
        New plan
        <Plus aria-hidden className="h-4 w-4" />
      </button>
    </header>
  );
}
