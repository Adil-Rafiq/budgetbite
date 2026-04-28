'use client';

import { RefreshCw, Sparkles, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { cn } from '@/lib/utils';
import type { BudgetPlanDetail } from '@repo/shared';

interface PlanSummaryCardProps {
  plan: BudgetPlanDetail;
}

const fmtPkr = (n: number) => `PKR ${n.toLocaleString()}`;

/**
 * Drives the plan-detail summary header: budget progress, meals stats, and
 * the manual Generate / Regenerate CTA. We disable the CTA whenever a fresh
 * attempt is already pending, OR when the plan is in a terminal status
 * (cancelled / completed) — there's no point starting a new generation against
 * a plan the user is no longer running.
 */
export function PlanSummaryCard({ plan }: PlanSummaryCardProps) {
  const generate = useGenerateMealPlan();

  const ctx = plan.context;
  const spent = ctx.amountSpent;
  const total = ctx.totalBudget;
  const remaining = ctx.amountRemaining;
  const spentPercent =
    total > 0 ? Math.min(100, Math.max(0, Math.round((spent / total) * 100))) : 0;

  const hasActiveGen = !!plan.activeGeneration;
  const isPending = plan.latestAttempt?.status === 'pending';
  const isTerminalPlan = plan.status === 'cancelled' || plan.status === 'completed';
  const canTrigger = !isPending && !isTerminalPlan;

  return (
    <Card className="border-border">
      <CardContent className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Budget summary
            </div>
            <p className="text-3xl font-bold text-foreground leading-tight">
              {fmtPkr(remaining)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                of {fmtPkr(total)} left
              </span>
            </p>
          </div>

          <Button
            onClick={() => generate.mutate(plan.id)}
            disabled={!canTrigger || generate.isPending}
            className="shrink-0"
          >
            {hasActiveGen ? (
              <>
                <RefreshCw
                  className={cn('h-4 w-4 mr-1.5', generate.isPending && 'animate-spin')}
                />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" />
                Generate now
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{fmtPkr(spent)} spent</span>
            <span>{spentPercent}%</span>
          </div>
          <Progress value={spentPercent} className="h-2" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <SummaryStat
            label="Meals consumed"
            value={`${ctx.mealsConsumed} / ${ctx.totalMeals}`}
          />
          <SummaryStat label="Meals left" value={String(ctx.mealsRemaining)} />
          <SummaryStat
            label="Avg / meal"
            value={fmtPkr(Math.round(ctx.avgBudgetPerRemainingMeal))}
          />
          <SummaryStat
            label="Variance"
            value={
              ctx.cumulativeVariance >= 0
                ? `+${fmtPkr(Math.round(ctx.cumulativeVariance))}`
                : `−${fmtPkr(Math.round(Math.abs(ctx.cumulativeVariance)))}`
            }
            tone={
              ctx.cumulativeVariance >= 0
                ? 'text-accent'
                : ctx.cumulativeVariance < -total * 0.1
                  ? 'text-destructive'
                  : 'text-chart-4'
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Tracking:</span>
          {plan.mealTypes.map((mt) => (
            <Badge key={mt.id} variant="outline" className="text-xs capitalize">
              {mt.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg bg-secondary p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-bold text-card-foreground mt-0.5', tone)}>{value}</p>
    </div>
  );
}
