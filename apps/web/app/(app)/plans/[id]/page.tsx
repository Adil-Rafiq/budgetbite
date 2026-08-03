'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBudgetPlanById } from '@/hooks/use-budget-plan';
import { DataError } from '@/components/data-error';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import { PlanDetailHeader } from '@/app/(app)/plans/[id]/_components/plan-detail-header';
import { PlanSummaryCard } from '@/app/(app)/plans/[id]/_components/plan-summary-card';
import { PlanEndSummaryCard } from '@/app/(app)/plans/[id]/_components/plan-end-summary-card';
import { GenerationStatusBanner } from '@/app/(app)/plans/[id]/_components/generation-status-banner';
import { GenerationHistoryTimeline } from '@/app/(app)/plans/[id]/_components/generation-history-timeline';
import { PlanTimeline } from '@/app/(app)/plans/[id]/_components/plan-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeUp } from '@/components/motion';

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: plan, isLoading, error, refetch } = useBudgetPlanById(id);

  // Tab lives in the URL. With `defaultValue` alone, switching to Generation
  // history and pressing Back left the page entirely instead of returning to
  // the Plan tab — the wrong answer to the most common gesture on Android.
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') === 'history' ? 'history' : 'plan';

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 animate-pulse rounded bg-sand" />
          <div className="h-8 w-48 animate-pulse rounded bg-sand" />
          <div className="h-4 w-64 animate-pulse rounded bg-sand" />
        </div>
        <div className="h-44 w-full animate-pulse rounded-2xl bg-sand" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
        <Link
          href="/plans"
          className={`inline-flex w-fit items-center gap-1.5 rounded text-[12px] text-slate transition hover:text-teal-ink ${FOCUS_RING_ON_CANVAS}`}
        >
          ← Back to plans
        </Link>
        <DataError message="We couldn't load this plan." onRetry={() => refetch()} />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start gap-4">
        <Link
          href="/plans"
          className={`inline-flex items-center gap-1.5 rounded text-[12px] text-slate transition hover:text-teal-ink ${FOCUS_RING_ON_CANVAS}`}
        >
          ← Back to plans
        </Link>
        <div className="w-full rounded-2xl border border-dashed border-sand bg-surface p-8 text-center">
          <p className="text-sm text-slate">
            This plan doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/plans"
            className={`mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-deep px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-deeper ${FOCUS_RING}`}
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
      {/* The transient generation banner used to sit between the plan's
          identity and its numbers, splitting the two things that belong
          together. It reads as a notice about the summary, so it follows it. */}
      <FadeUp delay={0.06}>
        {plan.status === 'active' ? (
          <PlanSummaryCard plan={plan} />
        ) : (
          <PlanEndSummaryCard plan={plan} />
        )}
      </FadeUp>
      <FadeUp delay={0.12}>
        <GenerationStatusBanner plan={plan} />
      </FadeUp>

      <FadeUp delay={0.18}>
        <Tabs
          value={tab}
          onValueChange={(next) =>
            router.replace(
              next === 'history' ? `/plans/${plan.id}?tab=history` : `/plans/${plan.id}`,
            )
          }
          className="gap-4"
        >
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
