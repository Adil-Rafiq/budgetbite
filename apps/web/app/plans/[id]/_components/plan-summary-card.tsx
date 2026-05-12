'use client';

import { RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { cn } from '@/lib/utils';
import { Pill } from '@/components/ui/pill';
import type { BudgetPlanDetail } from '@repo/shared';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const AMBER = '#b8741a';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

interface PlanSummaryCardProps {
  plan: BudgetPlanDetail;
}

const fmtPkr = (n: number) => `₨ ${n.toLocaleString()}`;

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
  const disabled = !canTrigger || generate.isPending;

  const varianceTint =
    ctx.cumulativeVariance >= 0
      ? FATHOM
      : ctx.cumulativeVariance < -total * 0.1
        ? PULSE
        : AMBER;

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: WHITE,
        border: `1px solid ${LUMEN_DK}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div
              className="text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.22em' }}
            >
              budget summary
            </div>
            <p
              className="leading-tight"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: VAST,
              }}
            >
              {fmtPkr(remaining)}
              <span
                className="ml-2 text-[13px]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 400, color: MUTED }}
              >
                of {fmtPkr(total)} left
              </span>
            </p>
          </div>

          <Pill
            size="md"
            onClick={() => generate.mutate(plan.id)}
            disabled={disabled}
            className="shrink-0"
          >
            {hasActiveGen ? (
              <>
                <RefreshCw className={cn('h-4 w-4', generate.isPending && 'animate-spin')} />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate now
              </>
            )}
          </Pill>
        </div>

        <div className="flex flex-col gap-2">
          <div
            className="flex items-center justify-between text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
          >
            <span>{fmtPkr(spent)} spent</span>
            <span style={{ color: VAST, fontWeight: 600 }}>{spentPercent}%</span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: LUMEN_DK }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${spentPercent}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{
                background: `linear-gradient(90deg, ${FATHOM}, ${AMBER})`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat
            label="Consumed"
            value={`${ctx.mealsConsumed}/${ctx.totalMeals}`}
          />
          <SummaryStat label="Remaining" value={String(ctx.mealsRemaining)} />
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
            tint={varianceTint}
          />
        </div>

        {plan.mealTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="mr-1 text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
            >
              tracking
            </span>
            {plan.mealTypes.map((mt) => (
              <span
                key={mt.id}
                className="rounded-full px-2.5 py-0.5 text-[10px] capitalize"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: LUMEN,
                  color: VAST,
                  border: `1px solid ${LUMEN_DK}`,
                }}
              >
                {mt.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint?: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: LUMEN, border: `1px solid ${LUMEN_DK}` }}
    >
      <p
        className="text-[9px] uppercase"
        style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
      >
        {label}
      </p>
      <p
        className="mt-0.5"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          color: tint ?? VAST,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </p>
    </div>
  );
}
