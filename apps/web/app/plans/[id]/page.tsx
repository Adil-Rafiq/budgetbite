'use client';

import { use } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgetPlanById } from '@/hooks/use-budget-plan';
import { PlanDetailHeader } from '@/app/plans/[id]/_components/plan-detail-header';
import { PlanSummaryCard } from '@/app/plans/[id]/_components/plan-summary-card';
import { GenerationStatusBanner } from '@/app/plans/[id]/_components/generation-status-banner';
import { GenerationHistoryTimeline } from '@/app/plans/[id]/_components/generation-history-timeline';

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: plan, isLoading, error } = useBudgetPlanById(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to plans
        </Link>
        <div className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Couldn&apos;t load this plan</p>
            <p className="text-xs opacity-80 mt-0.5">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to plans
        </Link>
        <div className="rounded-lg border border-dashed border-border p-8 text-center w-full">
          <p className="text-sm text-muted-foreground">
            This plan doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/plans">Back to plans</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PlanDetailHeader plan={plan} />
      <GenerationStatusBanner plan={plan} />
      <PlanSummaryCard plan={plan} />
      <GenerationHistoryTimeline planId={plan.id} plan={plan} />
    </div>
  );
}
