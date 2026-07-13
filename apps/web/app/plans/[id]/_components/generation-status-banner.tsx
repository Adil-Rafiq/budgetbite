'use client';

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { cn } from '@/lib/utils';
import type { BudgetPlanDetail } from '@repo/shared';

interface GenerationStatusBannerProps {
  plan: BudgetPlanDetail;
}

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
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">AI is refreshing your meal plan…</p>
          <p className="mt-0.5 text-[12px] opacity-80">
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
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">
            {isTimeout ? 'Generation timed out.' : "We couldn't update your plan."}
          </p>
          {!isTimeout && latest.errorMessage && (
            <p className="mt-0.5 line-clamp-2 text-[12px] opacity-80">{latest.errorMessage}</p>
          )}
          {isTimeout && (
            <p className="mt-0.5 text-[12px] opacity-80">
              The AI took too long to respond. Try again to refresh your plan.
            </p>
          )}
          {active && (
            <p className="mt-1 text-[12px] opacity-70">
              Your previous plan is still active and safe to use.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => generate.mutate(plan.id)}
          disabled={generate.isPending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-tomato/30 bg-white px-3 py-1.5 text-[12px] font-medium text-tomato transition-colors hover:bg-tomato/10 disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', generate.isPending && 'animate-spin')} />
          Retry
        </button>
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
  const toneClass =
    tone === 'pending'
      ? 'border-[#f5a623]/30 bg-[#fef6e6] text-[#8a5a12]'
      : 'border-tomato/20 bg-tomato/10 text-tomato';
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${toneClass}`}>
      {children}
    </div>
  );
}
