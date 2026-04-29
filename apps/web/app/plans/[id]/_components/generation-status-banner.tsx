'use client';

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { cn } from '@/lib/utils';
import type { BudgetPlanDetail } from '@repo/shared';

interface GenerationStatusBannerProps {
  plan: BudgetPlanDetail;
}

/**
 * Single-purpose status strip that sits above the timeline. Renders only when
 * the latest attempt diverges from the active suggestion plan:
 *
 *  - latestAttempt = pending → amber "we're regenerating in the background".
 *  - latestAttempt = failed AND ≠ activeGeneration → destructive "we couldn't
 *    refresh; the previous plan is still in place" with an inline retry.
 *
 * Any other shape (no attempts yet, latest succeeded, latest superseded) is
 * already conveyed elsewhere — the timeline shows the row, the summary card
 * shows the right CTA — so we render nothing to avoid stacking redundant UI.
 */
export function GenerationStatusBanner({ plan }: GenerationStatusBannerProps) {
  const generate = useGenerateMealPlan();
  const latest = plan.latestAttempt;
  const active = plan.activeGeneration;

  if (!latest) return null;
  if (latest.status === 'succeeded') return null;
  if (latest.status === 'superseded') return null;

  if (latest.status === 'pending') {
    return (
      <BannerShell tone="pending">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">AI is refreshing your meal plan…</p>
          <p className="text-xs opacity-80 mt-0.5">
            {active
              ? 'Your existing suggestions stay in place until the new plan is ready.'
              : 'This usually takes a few seconds.'}
          </p>
        </div>
      </BannerShell>
    );
  }

  if (latest.status === 'failed' && latest.id !== active?.id) {
    const isTimeout = latest.errorCode === 'TIMEOUT';
    return (
      <BannerShell tone="failed">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {isTimeout ? 'Generation timed out.' : "We couldn't update your plan."}
          </p>
          {!isTimeout && latest.errorMessage && (
            <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{latest.errorMessage}</p>
          )}
          {isTimeout && (
            <p className="text-xs opacity-80 mt-0.5">
              The AI took too long to respond. Try again to refresh your plan.
            </p>
          )}
          {active && (
            <p className="text-xs opacity-70 mt-1">
              Your previous plan is still active and safe to use.
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => generate.mutate(plan.id)}
          disabled={generate.isPending}
        >
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1', generate.isPending && 'animate-spin')} />
          Retry
        </Button>
      </BannerShell>
    );
  }

  return null;
}

function BannerShell({
  tone,
  children,
}: {
  tone: 'pending' | 'failed';
  children: React.ReactNode;
}) {
  const toneClasses =
    tone === 'pending'
      ? 'bg-chart-4/10 border-chart-4/30 text-chart-4'
      : 'bg-destructive/10 border-destructive/25 text-destructive';
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3',
        toneClasses,
      )}
    >
      {children}
    </div>
  );
}
