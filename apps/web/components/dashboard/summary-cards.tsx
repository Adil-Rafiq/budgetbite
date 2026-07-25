'use client';

import Link from 'next/link';
import { CircleCheck, TriangleAlert, ArrowRight } from 'lucide-react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { CountUp } from '@/components/motion';
import { formatPKR } from '@/lib/currency';

const getDaysLeft = (endDateStr: string): number => {
  const today = new Date();
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = endDateStr.split('-').map(Number);
  const endLocal = new Date(year!, month! - 1, day!);
  return Math.max(
    0,
    Math.ceil((endLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

const getSpendingHealth = (spent: number, total: number): 'good' | 'warning' | 'danger' => {
  const ratio = total > 0 ? spent / total : 0;
  if (ratio < 0.7) return 'good';
  if (ratio < 0.9) return 'warning';
  return 'danger';
};

function BudgetSkeleton() {
  return (
    <div className="rounded-2xl border border-sage bg-white p-5 shadow-sm sm:p-6">
      <div className="h-3 w-32 animate-pulse rounded bg-sage" />
      <div className="mt-3 h-9 w-44 animate-pulse rounded-lg bg-sage" />
      <div className="mt-2 h-3 w-56 animate-pulse rounded bg-sage" />
      <div className="mt-5 h-2.5 w-full animate-pulse rounded-full bg-sage" />
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-sage/70 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-14 animate-pulse rounded bg-sage" />
            <div className="mt-1.5 h-5 w-12 animate-pulse rounded bg-sage" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCardsError() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-tomato/30 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
      <TriangleAlert className="h-4 w-4 shrink-0" />
      We couldn&apos;t load your budget just now. Please refresh to try again.
    </div>
  );
}

function NoPlanMessage() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-sage bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-semibold uppercase tracking-widest text-green">
          No active plan
        </div>
        <p className="font-display text-xl font-semibold tracking-tight text-charcoal">
          Set a budget to get started.
        </p>
        <p className="text-[13px] text-slate">Two minutes. We&apos;ll plan the meals.</p>
      </div>
      <Link
        href="/plans"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-green px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-dark-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:self-auto"
      >
        Create plan
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/**
 * Budget standing. This is the *frame* around the meal chooser above it, not a
 * competing hero — one compact card: remaining, how that's tracking, and the
 * few numbers that inform the next meal choice. Spend appears once (no
 * repetition), and the derived metrics carry a plain-language explanation.
 */
export function SummaryCards() {
  const { data: planData, isLoading: isPlanLoading, error: planError } = useActiveBudgetPlan();
  const { plan: activePlan, budgetState: ctx } = planData ?? {};

  if (isPlanLoading) return <BudgetSkeleton />;
  if (planError) return <SummaryCardsError />;
  if (!activePlan) return <NoPlanMessage />;
  if (!ctx) return <BudgetSkeleton />;

  const daysLeft = getDaysLeft(activePlan.endDate);
  const health = getSpendingHealth(ctx.amountSpent, ctx.totalBudget);
  const spentPercent =
    ctx.totalBudget > 0 ? Math.round((ctx.amountSpent / ctx.totalBudget) * 100) : 0;
  const onTrack = health !== 'danger';
  const fillClass = health === 'danger' ? 'bg-tomato' : 'bg-green';

  return (
    <section className="rounded-2xl border border-sage bg-white p-5 shadow-sm sm:p-6">
      {/* Remaining + how it's tracking */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate">
              {activePlan.planType} budget
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-display text-4xl font-bold leading-none tracking-tight text-charcoal">
              <CountUp value={ctx.amountRemaining} prefix="₨ " />
            </span>
            <span className="pb-0.5 text-sm font-medium text-slate">left</span>
          </div>
          <p className="mt-1.5 text-xs text-slate">
            of {formatPKR(ctx.totalBudget)} ·{' '}
            <span className="font-semibold text-tomato">{formatPKR(ctx.amountSpent)} spent</span>
          </p>
        </div>

        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
            onTrack ? 'bg-green/10 text-dark-green' : 'bg-tomato/10 text-tomato'
          }`}
          title={
            onTrack
              ? "You're spending in line with your budget for the days left."
              : "You're spending faster than your budget for the days left — ease off to make it last."
          }
        >
          {onTrack ? (
            <CircleCheck className="h-3.5 w-3.5" />
          ) : (
            <TriangleAlert className="h-3.5 w-3.5" />
          )}
          {onTrack ? 'On track' : 'Watch spending'}
        </div>
      </div>

      {/* Progress — exact fill, percentage outside the track */}
      <div className="mt-4 flex items-center gap-3">
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-sage/40"
          role="progressbar"
          aria-valuenow={spentPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of budget spent"
        >
          <div
            className={`h-full rounded-full ${fillClass}`}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate">
          {spentPercent}% spent
        </span>
      </div>

      {/* The few numbers that inform the next meal choice */}
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-sage/70 pt-4">
        <div>
          <dt className="text-[11px] text-slate sm:text-xs">Days left</dt>
          <dd className="font-display text-base font-bold tabular-nums text-charcoal">
            {daysLeft}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate sm:text-xs">Meals left</dt>
          <dd className="font-display text-base font-bold tabular-nums text-charcoal">
            {ctx.mealsRemaining}
          </dd>
        </div>
        <div title="Your remaining budget shared evenly across the meals you have left.">
          <dt className="text-[11px] text-slate sm:text-xs">Per meal left</dt>
          <dd className="font-display text-base font-bold tabular-nums text-green">
            {formatPKR(ctx.avgBudgetPerRemainingMeal)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
