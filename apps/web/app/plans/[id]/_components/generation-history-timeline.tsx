'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useBudgetPlanGenerations } from '@/hooks/use-budget-plan';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { Pill } from '@/components/ui/pill';
import { GenerationAttemptItem } from './generation-attempt-item';
import type { BudgetGeneration, BudgetPlanDetail } from '@repo/shared';

interface GenerationHistoryTimelineProps {
  planId: string;
  plan: BudgetPlanDetail;
}

function TimelineSkeleton() {
  return (
    <div className="relative">
      <div
        className="absolute left-4 bottom-2 top-2 w-px bg-lumen-dk"
        aria-hidden
      />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pl-10">
            <div className="h-20 w-full animate-pulse rounded-xl bg-lumen" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-pulse/20 bg-pulse/[0.06] p-3 text-[13px] text-pulse">
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      <span>{message}</span>
    </div>
  );
}

function TimelineEmpty({ planId }: { planId: string }) {
  const generate = useGenerateMealPlan();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lumen-dk bg-white p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fathom/[0.08] text-fathom">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[14px] font-medium text-vast">No plans generated yet</p>
        <p className="mt-1 text-[12px] text-ink">
          Kick off your first AI-curated meal plan to see suggestions for every day.
        </p>
      </div>
      <Pill size="sm" onClick={() => generate.mutate(planId)} disabled={generate.isPending}>
        <Sparkles className="h-3.5 w-3.5" />
        Generate now
      </Pill>
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
          <span
            className="text-[10px] uppercase text-fathom"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
          >
            /history
          </span>
          <h2
            className="text-vast"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Generation history
          </h2>
        </div>
        {total > 0 && (
          <span
            className="text-[11px] text-soft"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
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
        <div
          className="absolute left-[15px] bottom-2 top-2 w-px bg-lumen-dk"
          aria-hidden
        />
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
        <p
          className="text-center text-[11px] text-soft"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          showing the latest {items.length} of {total} attempts
        </p>
      )}
    </div>
  );
}
