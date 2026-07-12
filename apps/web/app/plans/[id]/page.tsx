'use client';

import { use } from 'react';
import Link from 'next/link';
import { useBudgetPlanById } from '@/hooks/use-budget-plan';
import { PlanDetailHeader } from '@/app/plans/[id]/_components/plan-detail-header';
import { PlanSummaryCard } from '@/app/plans/[id]/_components/plan-summary-card';
import { PlanEndSummaryCard } from '@/app/plans/[id]/_components/plan-end-summary-card';
import { GenerationStatusBanner } from '@/app/plans/[id]/_components/generation-status-banner';
import { GenerationHistoryTimeline } from '@/app/plans/[id]/_components/generation-history-timeline';
import { PlanTimeline } from '@/app/plans/[id]/_components/plan-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeUp } from '@/components/motion';

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: plan, isLoading, error } = useBudgetPlanById(id);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 animate-pulse rounded bg-sage" />
          <div className="h-8 w-48 animate-pulse rounded bg-sage" />
          <div className="h-4 w-64 animate-pulse rounded bg-sage" />
        </div>
        <div className="h-44 w-full animate-pulse rounded-2xl bg-sage" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-sage" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
        <Link
          href="/plans"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] text-slate transition hover:text-green"
        >
          ← Back to plans
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-tomato/30 bg-tomato/[0.06] p-4 text-tomato">
          <span className="font-semibold">!</span>
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
          className="inline-flex items-center gap-1.5 text-[12px] text-slate transition hover:text-green"
        >
          ← Back to plans
        </Link>
        <div className="w-full rounded-2xl border border-dashed border-sage bg-white p-8 text-center">
          <p className="text-sm text-slate">
            This plan doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/plans"
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-green"
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
        {plan.status === 'active' ? (
          <PlanSummaryCard plan={plan} />
        ) : (
          <PlanEndSummaryCard plan={plan} />
        )}
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
