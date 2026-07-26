'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useBudgetPlanGenerations } from '@/hooks/use-budget-plan';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { DataError } from '@/components/data-error';
import { FOCUS_RING } from '@/lib/focus-ring';
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
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl bg-green px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
      >
        <Sparkles aria-hidden className="h-3.5 w-3.5" />
        Generate now
      </button>
    </div>
  );
}

const PAGE_SIZE = 20;

export function GenerationHistoryTimeline({ planId, plan }: GenerationHistoryTimelineProps) {
  // "Showing the latest 20 of 47 attempts" used to be the end of the road —
  // a count of what you could not reach. Now it loads more.
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { data, isLoading, isFetching, error, refetch } = useBudgetPlanGenerations(planId, {
    limit,
    offset: 0,
  });

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
        <DataError message="We couldn't load this plan's history." onRetry={() => refetch()} />
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
                ctx={plan.context}
              />
            </li>
          ))}
        </ol>
      </div>

      {data?.meta && total > items.length && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate/60">
            Showing the latest {items.length} of {total} attempts
          </p>
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE_SIZE)}
            disabled={isFetching}
            className={`min-h-11 rounded-lg border border-sage bg-white px-4 text-[12px] font-semibold text-dark-green transition-colors hover:border-dark-green disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
          >
            {isFetching ? 'Loading…' : 'Show older attempts'}
          </button>
        </div>
      )}
    </div>
  );
}
