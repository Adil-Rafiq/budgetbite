'use client';

import { RefreshCw, Sparkles, Store } from 'lucide-react';
import { usePlanSummary } from '@/hooks/use-budget-plan';
import { useStartNextPlan } from '@/app/plans/_hooks/use-start-next-plan';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING } from '@/lib/focus-ring';
import type { BudgetPlanDetail } from '@repo/shared';

export function PlanEndSummaryCard({ plan }: { plan: BudgetPlanDetail }) {
  const { data: summary, isLoading } = usePlanSummary(plan.id);
  const { start, confirmOpen, setConfirmOpen, confirmReplace, isPending } = useStartNextPlan(plan);

  if (isLoading || !summary) {
    return <div className="h-40 w-full animate-pulse rounded-2xl bg-sage" />;
  }

  const saved = summary.variance >= 0;
  const varianceTone = saved ? 'text-green' : 'text-tomato';
  const statusLabel = plan.status === 'cancelled' ? 'cancelled' : 'wrapped up';

  return (
    <div className="overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate/60">
              Plan {statusLabel} · summary
            </div>
            <p
              className={`font-display text-[32px] font-semibold leading-tight tracking-tight tabular-nums ${varianceTone}`}
            >
              {saved ? '+' : '−'}
              {formatPKR(Math.abs(summary.variance))}
              <span className="ml-2 text-[13px] font-normal text-slate">
                {saved ? 'saved' : 'over budget'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={start}
            disabled={isPending}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-green px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
          >
            {isPending ? (
              <RefreshCw aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden className="h-4 w-4" />
            )}
            Start next plan
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryStat
            label="Spent"
            value={`${formatPKR(summary.amountSpent)} / ${formatPKR(summary.totalBudget)}`}
          />
          <SummaryStat
            label="Meals logged"
            value={`${summary.mealsLogged}/${summary.totalMeals}`}
          />
          {/* "Adherence to AI 62%" was the most interesting number on the card
              and the most opaque — a percentage of nothing the user was told
              about. */}
          <SummaryStat
            label="Followed suggestions"
            value={summary.adherencePercent === null ? '—' : `${summary.adherencePercent}%`}
            hint={
              summary.adherencePercent === null
                ? 'No logged meals to compare.'
                : 'Share of logged meals that came from a suggested option.'
            }
          />
        </div>

        {summary.favoriteRestaurant && (
          <div className="flex items-center gap-2 rounded-xl border border-sage bg-canvas px-4 py-3">
            <Store aria-hidden className="h-4 w-4 shrink-0 text-slate/60" />
            <p className="min-w-0 text-[13px] text-charcoal">
              Ordered most from{' '}
              <span className="font-semibold">{summary.favoriteRestaurant.name}</span>
              <span className="ml-1.5 text-[11px] text-slate/60">
                ({summary.favoriteRestaurant.choiceCount}×)
              </span>
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="text-xs font-semibold uppercase tracking-widest text-tomato">
              Confirm · Replace
            </div>
            <AlertDialogTitle className="font-display text-xl font-semibold tracking-tight text-charcoal">
              Replace active plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate">
              You already have an active plan. Cancel it and start a new one with the same settings
              as this one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={`min-h-11 rounded-xl border border-sage bg-white px-4 text-[13px] font-medium text-slate transition-colors hover:bg-canvas active:scale-[0.97] ${FOCUS_RING}`}
            >
              Keep current plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReplace}
              className={`min-h-11 rounded-xl bg-green px-5 text-[13px] font-semibold text-white transition-colors hover:bg-dark-green active:scale-[0.97] ${FOCUS_RING}`}
            >
              Replace plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-sage bg-canvas p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate/60">{label}</p>
      <p className="mt-0.5 font-display text-[15px] font-semibold tabular-nums tracking-tight text-charcoal">
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] leading-snug text-slate/70">{hint}</p>}
    </div>
  );
}
