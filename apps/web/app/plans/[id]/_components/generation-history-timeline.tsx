'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useBudgetPlanGenerations } from '@/hooks/use-budget-plan';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { GenerationAttemptItem } from './generation-attempt-item';
import type { BudgetGeneration, BudgetPlanDetail } from '@repo/shared';

interface GenerationHistoryTimelineProps {
  planId: string;
  plan: BudgetPlanDetail;
}

function TimelineSkeleton() {
  return (
    <div className="relative">
      <div className="absolute bottom-2 left-4 top-2 w-px bg-sage" aria-hidden />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pl-10">
            <div className="h-20 w-full animate-pulse rounded-xl bg-sage" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-tomato/20 bg-tomato/[0.06] p-3 text-[13px] text-tomato">
      <span className="font-semibold">!</span>
      <span>{message}</span>
    </div>
  );
}

function TimelineEmpty({ planId }: { planId: string }) {
  const generate = useGenerateMealPlan();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sage bg-white p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/10 text-green">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[14px] font-medium text-charcoal">No plans generated yet</p>
        <p className="mt-1 text-[12px] text-slate">
          Kick off your first AI-curated meal plan to see suggestions for every day.
        </p>
      </div>
      <button
        type="button"
        onClick={() => generate.mutate(planId)}
        disabled={generate.isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generate now
      </button>
    </div>
  );
}

export function GenerationHistoryTimeline({ planId, plan }: GenerationHistoryTimelineProps) {
  const { data, isLoading, error } = useBudgetPlanGenerations(planId);

  const activeId = plan.activeGeneration?.id ?? null;
  const latestId = plan.latestAttempt?.id ?? null;
  const newerPending = plan.latestAttempt?.status === 'pending';

  const items = data?.data ?? [];
  const total = data?.meta.total ?? items.length;

  const header = useMemo(
    () => (
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-green">
            History
          </span>
          <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal">
            Generation history
          </h2>
        </div>
        {total > 0 && (
          <span className="text-[11px] text-slate/60">
            {total} attempt{total === 1 ? '' : 's'}
          </span>
        )}
      </div>
    ),
    [total],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <TimelineSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <TimelineError message={`Failed to load generation history: ${error.message}`} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <TimelineEmpty planId={planId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}

      <div className="relative">
        <div className="absolute bottom-2 left-[15px] top-2 w-px bg-sage" aria-hidden />
        <ol className="flex flex-col gap-3">
          {items.map((gen: BudgetGeneration) => (
            <li key={gen.id}>
              <GenerationAttemptItem
                generation={gen}
                planId={planId}
                isActive={gen.id === activeId}
                isLatest={gen.id === latestId}
                canTriggerRetry={!newerPending}
              />
            </li>
          ))}
        </ol>
      </div>

      {data?.meta && total > items.length && (
        <p className="text-center text-[11px] text-slate/60">
          Showing the latest {items.length} of {total} attempts
        </p>
      )}
    </div>
  );
}
