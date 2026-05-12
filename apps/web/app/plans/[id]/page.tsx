'use client';

import { use } from 'react';
import Link from 'next/link';
import { useBudgetPlanById } from '@/hooks/use-budget-plan';
import { PlanDetailHeader } from '@/app/plans/[id]/_components/plan-detail-header';
import { PlanSummaryCard } from '@/app/plans/[id]/_components/plan-summary-card';
import { GenerationStatusBanner } from '@/app/plans/[id]/_components/generation-status-banner';
import { GenerationHistoryTimeline } from '@/app/plans/[id]/_components/generation-history-timeline';
import { PlanTimeline } from '@/app/plans/[id]/_components/plan-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeUp } from '@/components/motion';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const PULSE = '#7f1c34';
const WHITE = '#ffffff';
const MUTED = '#71716a';

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: plan, isLoading, error } = useBudgetPlanById(id);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 animate-pulse rounded" style={{ background: LUMEN_DK }} />
          <div className="h-8 w-48 animate-pulse rounded" style={{ background: LUMEN_DK }} />
          <div className="h-4 w-64 animate-pulse rounded" style={{ background: LUMEN_DK }} />
        </div>
        <div className="h-44 w-full animate-pulse rounded-2xl" style={{ background: LUMEN_DK }} />
        <div className="h-32 w-full animate-pulse rounded-2xl" style={{ background: LUMEN_DK }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
        <Link
          href="/plans"
          className="inline-flex w-fit items-center gap-1.5 text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
        >
          ← back to plans
        </Link>
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{ background: 'rgba(127,28,52,0.06)', border: `1px solid ${PULSE}`, color: PULSE }}
        >
          <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium">Couldn&apos;t load this plan</p>
            <p className="mt-0.5 text-[12px] opacity-80">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start gap-4">
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
        >
          ← back to plans
        </Link>
        <div
          className="w-full rounded-2xl p-8 text-center"
          style={{ background: WHITE, border: `1px dashed ${LUMEN_DK}` }}
        >
          <p className="text-[14px]" style={{ color: MUTED }}>
            This plan doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/plans"
            className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]"
            style={{ background: VAST, color: LUMEN }}
          >
            Back to plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
      <FadeUp>
        <PlanDetailHeader plan={plan} />
      </FadeUp>
      <FadeUp delay={0.06}>
        <GenerationStatusBanner plan={plan} />
      </FadeUp>
      <FadeUp delay={0.12}>
        <PlanSummaryCard plan={plan} />
      </FadeUp>

      <FadeUp delay={0.18}>
        <Tabs defaultValue="plan" className="gap-4">
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="history">Generation history</TabsTrigger>
          </TabsList>
          <TabsContent value="plan" className="pt-2">
            <PlanTimeline plan={plan} />
          </TabsContent>
          <TabsContent value="history" className="pt-2">
            <GenerationHistoryTimeline planId={plan.id} plan={plan} />
          </TabsContent>
        </Tabs>
      </FadeUp>
    </div>
  );
}
