'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useBudgetPlanGenerations } from '@/hooks/use-budget-plan';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { Pill, Stagger, StaggerItem } from '@/components/motion';
import { GenerationAttemptItem } from './generation-attempt-item';
import type { BudgetGeneration, BudgetPlanDetail } from '@repo/shared';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

interface GenerationHistoryTimelineProps {
  planId: string;
  plan: BudgetPlanDetail;
}

function TimelineSkeleton() {
  return (
    <div className="relative">
      <div
        className="absolute left-4 top-2 bottom-2 w-px"
        style={{ background: LUMEN_DK }}
        aria-hidden
      />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pl-10">
            <div
              className="h-20 w-full animate-pulse rounded-xl"
              style={{ background: LUMEN }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineError({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl p-3 text-[13px]"
      style={{ background: 'rgba(127,28,52,0.06)', border: `1px solid ${PULSE}33`, color: PULSE }}
    >
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      <span>{message}</span>
    </div>
  );
}

function TimelineEmpty({ planId }: { planId: string }) {
  const generate = useGenerateMealPlan();
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl p-8 text-center"
      style={{ background: WHITE, border: `1px dashed ${LUMEN_DK}` }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: `${FATHOM}14`, color: FATHOM }}
      >
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p
          className="text-[14px] font-medium"
          style={{ color: VAST }}
        >
          No plans generated yet
        </p>
        <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
          Kick off your first AI-curated meal plan to see suggestions for every day.
        </p>
      </div>
      <Pill
        onClick={() => generate.mutate(planId)}
        disabled={generate.isPending}
        style={{ padding: '8px 16px', fontSize: 13 }}
      >
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
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            /history
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: VAST,
            }}
          >
            Generation history
          </h2>
        </div>
        {total > 0 && (
          <span
            className="text-[11px]"
            style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
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
          className="absolute left-[15px] top-2 bottom-2 w-px"
          style={{ background: LUMEN_DK }}
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
          className="text-center text-[11px]"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
        >
          showing the latest {items.length} of {total} attempts
        </p>
      )}
    </div>
  );
}
