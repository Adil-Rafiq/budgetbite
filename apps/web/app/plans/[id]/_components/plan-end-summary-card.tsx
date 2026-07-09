'use client';

import { RefreshCw, Sparkles, Store } from 'lucide-react';
import { usePlanSummary } from '@/hooks/use-budget-plan';
import { useStartNextPlan } from '@/app/plans/_hooks/use-start-next-plan';
import { Pill } from '@/components/ui/pill';
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
import type { BudgetPlanDetail } from '@repo/shared';

const fmtPkr = (n: number) => `₨ ${Math.round(n).toLocaleString()}`;

export function PlanEndSummaryCard({ plan }: { plan: BudgetPlanDetail }) {
  const { data: summary, isLoading } = usePlanSummary(plan.id);
  const { start, confirmOpen, setConfirmOpen, confirmReplace, isPending } = useStartNextPlan(plan);

  if (isLoading || !summary) {
    return <div className="h-40 w-full animate-pulse rounded-2xl bg-lumen-dk" />;
  }

  const saved = summary.variance >= 0;
  const varianceTone = saved ? 'text-fathom' : 'text-pulse';
  const statusLabel = plan.status === 'cancelled' ? 'cancelled' : 'wrapped up';

  return (
    <div className="overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div
              className="text-[10px] uppercase text-soft"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              plan {statusLabel} · summary
            </div>
            <p
              className={`leading-tight ${varianceTone}`}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {saved ? '+' : '−'}
              {fmtPkr(Math.abs(summary.variance))}
              <span
                className="ml-2 text-[13px] font-normal text-ink"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {saved ? 'saved' : 'over budget'}
              </span>
            </p>
          </div>

          <Pill size="md" onClick={start} disabled={isPending} className="shrink-0">
            {isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Start next plan
          </Pill>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryStat
            label="Spent"
            value={`${fmtPkr(summary.amountSpent)} / ${fmtPkr(summary.totalBudget)}`}
          />
          <SummaryStat
            label="Meals logged"
            value={`${summary.mealsLogged}/${summary.totalMeals}`}
          />
          <SummaryStat
            label="Adherence to AI"
            value={summary.adherencePercent === null ? '—' : `${summary.adherencePercent}%`}
          />
        </div>

        {summary.favoriteRestaurant && (
          <div className="flex items-center gap-2 rounded-xl border border-lumen-dk bg-lumen px-4 py-3">
            <Store className="h-4 w-4 shrink-0 text-soft" />
            <p className="min-w-0 text-[13px] text-vast">
              Ordered most from{' '}
              <span className="font-semibold">{summary.favoriteRestaurant.name}</span>
              <span
                className="ml-1.5 text-[11px] text-soft"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ({summary.favoriteRestaurant.choiceCount}×)
              </span>
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div
              className="text-[10px] uppercase text-pulse"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              confirm · /replace
            </div>
            <AlertDialogTitle
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Replace active plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-ink">
              You already have an active plan. Cancel it and start a new one with the same settings
              as this one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-full border border-lumen-dk bg-transparent px-4 py-2 text-[13px] text-vast transition-colors hover:bg-lumen active:scale-[0.97]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Keep current plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReplace}
              className="rounded-full bg-vast px-5 py-2 text-[13px] font-medium text-lumen transition-colors hover:bg-vast/85 active:scale-[0.97]"
            >
              Replace plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-lumen-dk bg-lumen p-3">
      <p
        className="text-[9px] uppercase text-soft"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </p>
    </div>
  );
}
