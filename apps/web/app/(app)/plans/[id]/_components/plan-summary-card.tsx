'use client';

import Link from 'next/link';
import { CircleCheck, MapPin, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { formatPKR } from '@/lib/currency';
import { BudgetProgress } from '@/components/budget/budget-progress';
import { RemainingAmount } from '@/components/budget/remaining-amount';
import { BUDGET_FIT_PILL } from '@/components/budget-fit-badge';
import {
  getSpendingHealth,
  isAlarming,
  spendingHealthCaption,
} from '@/lib/budget-plan/spending-health';
import { FOCUS_RING } from '@/lib/focus-ring';
import type { BudgetPlanDetail } from '@repo/shared';

interface PlanSummaryCardProps {
  plan: BudgetPlanDetail;
}

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
  // Not clamped to 100: overspend is the state this surface most needs to show.
  const spentPercent = total > 0 ? Math.max(0, Math.round((spent / total) * 100)) : 0;

  const health = getSpendingHealth({ spent, total, remaining });
  const alarm = isAlarming(health);
  const statusPill =
    health === 'over'
      ? { cls: 'bg-tomato/10 text-tomato-ink', Icon: TriangleAlert, label: 'Over budget' }
      : health === 'danger'
        ? { cls: 'bg-tomato/10 text-tomato-ink', Icon: TriangleAlert, label: 'Watch spending' }
        : health === 'warning'
          ? { cls: BUDGET_FIT_PILL.amber.pill, Icon: TriangleAlert, label: 'Tight' }
          : { cls: 'bg-teal/10 text-teal-deep', Icon: CircleCheck, label: 'On track' };

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
      ? 'text-teal-deep'
      : ctx.cumulativeVariance < -total * 0.1
        ? 'text-tomato-ink'
        : BUDGET_FIT_PILL.amber.text;

  return (
    <div className="overflow-hidden rounded-2xl border border-sand bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${alarm ? 'bg-tomato' : 'bg-teal'}`}
              />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate/60">
                Budget summary
              </span>
            </div>
            {/* Was `{formatPKR(remaining)} of {total} left` — with a negative
                remaining that rendered "₨ -5,000 of ₨ 45,000 left", a
                hyphen-width minus on a 32px number followed by the word
                "left". */}
            <RemainingAmount remaining={remaining} size="lg" />
            <p className="text-[12px] text-slate">
              of {formatPKR(total)} ·{' '}
              <span className="font-semibold tabular-nums text-tomato-ink">
                {formatPKR(spent)} spent
              </span>
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusPill.cls}`}
            >
              <statusPill.Icon aria-hidden className="h-3.5 w-3.5" />
              {statusPill.label}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={disabled}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-deep px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-deeper disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
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
            </button>
          </div>
        </div>

        {needsLocation && (
          <div className="flex items-start gap-3 rounded-xl border border-amber/30 bg-amber-tint px-4 py-3 text-amber-ink">
            <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">Set your location to generate a plan</p>
              <p className="mt-0.5 text-[12px] opacity-80">
                We use it to find restaurants near you. Finish onboarding to add your location, then
                come back to generate suggestions.
              </p>
            </div>
            <Link
              href="/onboarding"
              className={`inline-flex min-h-11 shrink-0 items-center rounded-lg border border-amber/40 bg-white px-3 text-[12px] font-medium text-amber-ink transition-colors hover:bg-amber-tint ${FOCUS_RING}`}
            >
              Complete setup
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <BudgetProgress spentPercent={spentPercent} health={health} />
          <div className="flex items-center justify-between gap-3 text-[12px]">
            {/* Plain-language standing, not a colour the user has to interpret.
                The bar used to flip red at exactly 90% and look identical at
                150%. */}
            <p className={alarm ? 'text-tomato-ink' : 'text-slate'}>
              {spendingHealthCaption(health, remaining)}
            </p>
            <span
              className={`shrink-0 font-semibold tabular-nums ${alarm ? 'text-tomato-ink' : 'text-slate'}`}
            >
              {spentPercent}% spent
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Consumed" value={`${ctx.mealsConsumed}/${ctx.totalMeals}`} />
          <SummaryStat label="Remaining" value={String(ctx.mealsRemaining)} />
          {/* `formatPKR` already rounds; the extra `Math.round` here was a
              second opinion on the same number. */}
          <SummaryStat label="Avg / meal" value={formatPKR(ctx.avgBudgetPerRemainingMeal)} />
          <SummaryStat
            label="Variance"
            value={
              ctx.cumulativeVariance >= 0
                ? `+${formatPKR(ctx.cumulativeVariance)}`
                : `−${formatPKR(Math.abs(ctx.cumulativeVariance))}`
            }
            toneClass={varianceTone}
          />
        </div>

        {plan.mealTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60">
              Tracking
            </span>
            {plan.mealTypes.map((mt) => (
              <span
                key={mt.id}
                className="rounded-full border border-sand bg-canvas px-2.5 py-0.5 text-[10px] capitalize text-slate"
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
    <div className="rounded-lg border border-sand bg-canvas p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate/60">{label}</p>
      <p
        className={`mt-0.5 font-display text-[15px] font-semibold tabular-nums tracking-tight ${toneClass ?? 'text-charcoal'}`}
      >
        {value}
      </p>
    </div>
  );
}
