'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Utensils, Flame, PiggyBank, CircleCheck, TriangleAlert, ArrowRight } from 'lucide-react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { CountUp, Stagger, StaggerItem } from '@/components/motion';

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

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-sage bg-white p-6">
        <div className="h-3 w-40 animate-pulse rounded bg-sage" />
        <div className="mt-4 h-12 w-56 animate-pulse rounded-lg bg-sage" />
        <div className="mt-3 h-3 w-64 animate-pulse rounded bg-sage" />
        <div className="mt-6 h-4 w-full animate-pulse rounded-full bg-sage" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-sage bg-white p-4">
            <div className="mx-auto h-9 w-9 animate-pulse rounded-xl bg-sage" />
            <div className="mx-auto mt-2 h-5 w-12 animate-pulse rounded bg-sage" />
            <div className="mx-auto mt-1.5 h-3 w-16 animate-pulse rounded bg-sage" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCardsError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-tomato/30 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
      <TriangleAlert className="h-4 w-4 shrink-0" />
      {message}
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
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-green px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-dark-green sm:self-auto"
      >
        Create plan
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

interface QuickStat {
  icon: ReactNode;
  tint: string;
  value: ReactNode;
  label: string;
  valueClass?: string;
}

export function SummaryCards() {
  const { data: planData, isLoading: isPlanLoading, error: planError } = useActiveBudgetPlan();
  const { plan: activePlan, budgetState: ctx } = planData ?? {};

  if (isPlanLoading) return <HeroSkeleton />;
  if (planError)
    return <SummaryCardsError message={`Failed to load budget plan: ${planError.message}`} />;
  if (!activePlan) return <NoPlanMessage />;
  if (!ctx) return <HeroSkeleton />;

  const daysLeft = getDaysLeft(activePlan.endDate);
  const health = getSpendingHealth(ctx.amountSpent, ctx.totalBudget);
  const spentPercent =
    ctx.totalBudget > 0 ? Math.round((ctx.amountSpent / ctx.totalBudget) * 100) : 0;
  const onTrack = health !== 'danger';
  const fillClass = health === 'danger' ? 'bg-tomato' : 'bg-green';

  const quickStats: QuickStat[] = [
    {
      icon: <Utensils className="h-4 w-4" />,
      tint: 'bg-green/10 text-green',
      value: (
        <>
          <CountUp value={ctx.mealsConsumed} />
          <span className="text-slate">/{ctx.totalMeals}</span>
        </>
      ),
      label: 'Meals logged',
    },
    {
      icon: <Flame className="h-4 w-4" />,
      tint: 'bg-tomato/10 text-tomato',
      value: <CountUp value={ctx.amountSpent} prefix="₨ " />,
      label: 'Total spent',
    },
    {
      icon: <PiggyBank className="h-4 w-4" />,
      tint: 'bg-sage text-dark-green',
      value: <CountUp value={Math.round(ctx.avgBudgetPerRemainingMeal)} prefix="₨ " />,
      label: 'Per meal left',
      valueClass: 'text-green',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Budget hero */}
      <section className="rounded-2xl border border-sage bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate">
                {activePlan.planType} budget · Remaining
              </span>
            </div>
            <div className="flex items-end gap-2.5">
              <span className="font-display text-5xl font-bold leading-none tracking-tight text-charcoal sm:text-6xl">
                <CountUp value={ctx.amountRemaining} />
              </span>
              <span className="pb-1.5 font-display text-lg font-semibold text-slate">PKR</span>
            </div>
            <p className="mt-1.5 text-xs text-slate">
              of{' '}
              <strong className="font-semibold text-charcoal">
                ₨ {ctx.totalBudget.toLocaleString()}
              </strong>{' '}
              total ·{' '}
              <span className="font-semibold text-tomato">
                ₨ {ctx.amountSpent.toLocaleString()} spent
              </span>
            </p>
          </div>

          <div className="flex gap-6 sm:flex-col sm:gap-3 sm:text-right">
            <div>
              <p className="text-xs text-slate">Days remaining</p>
              <p className="font-display text-base font-bold text-green">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate">On track</p>
              <div className="flex items-center gap-1 sm:justify-end">
                {onTrack ? (
                  <CircleCheck className="h-3.5 w-3.5 text-green" />
                ) : (
                  <TriangleAlert className="h-3.5 w-3.5 text-tomato" />
                )}
                <p
                  className={`font-display text-sm font-bold ${onTrack ? 'text-green' : 'text-tomato'}`}
                >
                  {onTrack ? 'Yes' : 'Watch'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-4 overflow-hidden rounded-full bg-sage/40">
          <div
            className={`flex h-full items-center justify-end rounded-full pr-2 ${fillClass}`}
            style={{ width: `${Math.max(spentPercent, 8)}%` }}
          >
            <span className="text-[9px] font-bold text-white">{spentPercent}%</span>
          </div>
        </div>
        <div className="mt-1.5 flex justify-between">
          <span className="flex items-center gap-1.5 text-xs text-slate">
            <span className={`h-2 w-2 rounded-full ${fillClass}`} /> Spent: ₨{' '}
            {ctx.amountSpent.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate">
            {ctx.mealsRemaining} {ctx.mealsRemaining === 1 ? 'meal' : 'meals'} left
          </span>
        </div>
      </section>

      {/* Quick stats */}
      <Stagger className="grid grid-cols-3 gap-3">
        {quickStats.map((stat, i) => (
          <StaggerItem key={i}>
            <div className="rounded-2xl border border-sage bg-white p-4 text-center shadow-sm">
              <div
                className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${stat.tint}`}
              >
                {stat.icon}
              </div>
              <p
                className={`font-display text-lg font-bold text-charcoal ${stat.valueClass ?? ''}`}
              >
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-slate">{stat.label}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
