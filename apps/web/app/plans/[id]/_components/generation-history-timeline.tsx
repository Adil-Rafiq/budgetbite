'use client';

import { useMemo } from 'react';
import { AlertCircle, History, Sparkles } from 'lucide-react';
import { useBudgetPlanGenerations } from '@/hooks/use-budget-plan';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GenerationAttemptItem } from './generation-attempt-item';
import type { BudgetGeneration, BudgetPlanDetail } from '@repo/shared';

interface GenerationHistoryTimelineProps {
  planId: string;
  /** Pulled from the parent `useBudgetPlanById` query — drives Active pill + retry gating. */
  plan: BudgetPlanDetail;
}

function TimelineSkeleton() {
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" aria-hidden />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pl-10">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function TimelineEmpty({ planId }: { planId: string }) {
  const generate = useGenerateMealPlan();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">No plans generated yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Kick off your first AI-curated meal plan to see suggestions for every day.
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => generate.mutate(planId)}
        disabled={generate.isPending}
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        Generate now
      </Button>
    </div>
  );
}

/**
 * Vertical timeline of generation attempts. The vertical rail is a single 1px
 * line on the left; per-row dots overlay it (rendered inside each item) so the
 * spacing stays in sync with the row's natural height.
 */
export function GenerationHistoryTimeline({ planId, plan }: GenerationHistoryTimelineProps) {
  const { data, isLoading, error } = useBudgetPlanGenerations(planId);

  // Resolve "active" via the same activeGeneration pointer the BE computes —
  // not just "the first succeeded item we see locally" — to stay correct
  // across pagination edges.
  const activeId = plan.activeGeneration?.id ?? null;
  const latestId = plan.latestAttempt?.id ?? null;
  const newerPending = plan.latestAttempt?.status === 'pending';

  const items = data?.data ?? [];
  const total = data?.meta.total ?? items.length;

  const header = useMemo(
    () => (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <History className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Generation history</h2>
        </div>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
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
        {/* Vertical rail — runs from the first dot to the last */}
        <div
          className="absolute left-[15px] top-2 bottom-2 w-px bg-border"
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
        <p className="text-center text-xs text-muted-foreground">
          Showing the latest {items.length} of {total} attempts.
        </p>
      )}
    </div>
  );
}
