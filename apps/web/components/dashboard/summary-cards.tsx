'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingDown, PiggyBank, CalendarDays, AlertCircle } from 'lucide-react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPKR = (value: number) =>
  `PKR ${value.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

/**
 * Uses local date parts to avoid UTC offset shifting the day.
 * e.g. 2 AM PKT (UTC+5) would otherwise show the previous day.
 */
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
  const ratio = spent / total;
  if (ratio < 0.7) return 'good';
  if (ratio < 0.9) return 'warning';
  return 'danger';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SummaryCardsError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function NoPlanMessage() {
  return (
    <div className="p-4 bg-muted text-muted-foreground rounded-lg border border-border text-sm">
      No active budget plan found. Create one to see your summary.
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SummaryCards() {
  const { data: planData, isLoading: isPlanLoading, error: planError } = useActiveBudgetPlan();
  const { plan: activePlan, budgetState: ctx } = planData ?? {};

  if (isPlanLoading) return <SummaryCardsSkeleton />;

  if (planError)
    return <SummaryCardsError message={`Failed to load budget plan: ${planError.message}`} />;

  if (!activePlan) return <NoPlanMessage />; // data === null, no error

  if (!ctx) return <SummaryCardsSkeleton />; // shouldn't happen, safety net

  const daysLeft = getDaysLeft(activePlan.endDate);
  const health = getSpendingHealth(ctx.amountSpent, ctx.totalBudget);

  const spentColor = {
    good: 'text-chart-2',
    warning: 'text-chart-3',
    danger: 'text-destructive',
  }[health];

  const spentBg = {
    good: 'bg-chart-2/10',
    warning: 'bg-chart-3/10',
    danger: 'bg-destructive/10',
  }[health];

  const cards = [
    {
      label: 'Total Budget',
      value: formatPKR(ctx.totalBudget),
      sub: `${activePlan.planType} plan`,
      icon: Wallet,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Amount Spent',
      value: formatPKR(ctx.amountSpent),
      sub: `${ctx.mealsConsumed} of ${ctx.totalMeals} meals`,
      icon: TrendingDown,
      color: spentColor,
      bg: spentBg,
    },
    {
      label: 'Remaining',
      value: formatPKR(ctx.amountRemaining),
      sub: `PKR ${Math.round(ctx.avgBudgetPerRemainingMeal).toLocaleString()} / meal`,
      icon: PiggyBank,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Days Left',
      value: `${daysLeft} days`,
      sub: `ends ${activePlan.endDate}`,
      icon: CalendarDays,
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${card.bg}`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground truncate">{card.label}</span>
                <span className="text-base font-bold text-card-foreground leading-tight truncate">
                  {card.value}
                </span>
                <span className="text-xs text-muted-foreground truncate">{card.sub}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
