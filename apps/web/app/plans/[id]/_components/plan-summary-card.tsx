'use client';

import Link from 'next/link';
import { MapPin, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { Pill } from '@/components/ui/pill';
import type { BudgetPlanDetail } from '@repo/shared';

interface PlanSummaryCardProps {
  plan: BudgetPlanDetail;
}

const fmtPkr = (n: number) => `₨ ${n.toLocaleString()}`;

export function PlanSummaryCard({ plan }: PlanSummaryCardProps) {
  const generate = useGenerateMealPlan();
  const { data: user, isLoading: isUserLoading } = useUser();

  // Generation needs a saved location to find nearby restaurants. We treat a
  // present lat/lng as "onboarding complete" since the location step is what
  // populates it. Block the call client-side so the user gets actionable
  // guidance instead of a back-end rejection.
  const profile = user?.profile;
  const hasLocation =
    typeof profile?.latitude === 'number' && typeof profile?.longitude === 'number';
  // Only treat location as missing once we've actually loaded the user — avoid
  // flashing the warning (or blocking) while the profile is still in flight.
  const needsLocation = !isUserLoading && !!user && !hasLocation;

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
  const disabled = !canTrigger || generate.isPending || needsLocation;

  const handleGenerate = () => {
    if (needsLocation) return; // guarded by `disabled`, but never call the API without a location
    generate.mutate(plan.id);
  };

  const varianceTone =
    ctx.cumulativeVariance >= 0
      ? 'text-fathom'
      : ctx.cumulativeVariance < -total * 0.1
        ? 'text-pulse'
        : 'text-amber';

  return (
    <div className="overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div
              className="text-[10px] uppercase text-soft"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              budget summary
            </div>
            <p
              className="leading-tight text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {fmtPkr(remaining)}
              <span
                className="ml-2 text-[13px] font-normal text-ink"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                of {fmtPkr(total)} left
              </span>
            </p>
          </div>

          <Pill size="md" onClick={handleGenerate} disabled={disabled} className="shrink-0">
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

        {needsLocation && (
          <div className="flex items-start gap-3 rounded-xl border border-amber/20 bg-amber/10 px-4 py-3 text-amber">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">Set your location to generate a plan</p>
              <p className="mt-0.5 text-[12px] opacity-80">
                We use it to find restaurants near you. Finish onboarding to add your location, then
                come back to generate suggestions.
              </p>
            </div>
            <Pill asChild variant="ghost" size="xs" className="shrink-0">
              <Link href="/onboarding">Complete setup</Link>
            </Pill>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div
            className="flex items-center justify-between text-[12px] text-ink"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span>{fmtPkr(spent)} spent</span>
            <span className="font-semibold text-vast">{spentPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-lumen-dk">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${spentPercent}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{
                background: 'linear-gradient(90deg, var(--color-fathom), var(--color-amber))',
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Consumed" value={`${ctx.mealsConsumed}/${ctx.totalMeals}`} />
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
            toneClass={varianceTone}
          />
        </div>

        {plan.mealTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="mr-1 text-[10px] uppercase text-soft"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
            >
              tracking
            </span>
            {plan.mealTypes.map((mt) => (
              <span
                key={mt.id}
                className="rounded-full border border-lumen-dk bg-lumen px-2.5 py-0.5 text-[10px] capitalize text-vast"
                style={{ fontFamily: 'var(--font-mono)' }}
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
  toneClass,
}: {
  label: string;
  value: string;
  toneClass?: string;
}) {
  return (
    <div className="rounded-lg border border-lumen-dk bg-lumen p-3">
      <p
        className="text-[9px] uppercase text-soft"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 ${toneClass ?? 'text-vast'}`}
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
