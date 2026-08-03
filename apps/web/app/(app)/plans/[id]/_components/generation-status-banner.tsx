'use client';

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { cn } from '@/lib/utils';
import { describeGenerationError } from '@/lib/budget-plan/generation-errors';
import { FOCUS_RING } from '@/lib/focus-ring';
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
        <Loader2 aria-hidden className="h-4 w-4 shrink-0 animate-spin" />
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
    const failure = describeGenerationError(latest.errorCode);
    return (
      <BannerShell tone="failed">
        <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">{failure.title}</p>
          <p className="mt-0.5 text-[12px] opacity-80">{failure.fix}</p>
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
          className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-tomato/30 bg-surface px-3 text-[12px] font-medium text-tomato-ink transition-colors hover:bg-tomato/10 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
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
      ? 'border-amber/30 bg-amber-tint text-amber-ink'
      : 'border-tomato/20 bg-tomato/10 text-tomato-ink';
  return (
    <div
      // Announced when generation starts, fails, or recovers — this banner is
      // the only signal that slow AI work is still running.
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${toneClass}`}
    >
      {children}
    </div>
  );
}
