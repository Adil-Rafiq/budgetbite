'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCw, TriangleAlert } from 'lucide-react';
import type { ActiveBudgetPlanResponse } from '@repo/shared';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { formatPKR } from '@/lib/currency';
import { daysRemainingInPeriod, periodElapsedFraction } from '@/lib/date';
import { FOCUS_RING, FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';

/**
 * The remaining-budget figure, wherever it appears.
 *
 * The sidebar rail and the header pill used to compute this separately from the
 * same query. They agreed on the number and disagreed on which facts mattered:
 * the pill carried the per-meal allowance, the rail did not, so the desktop —
 * the planning context — told the user less about their money than the phone
 * did. Both now render from here, and a fact added to one variant is a fact the
 * other has deliberately declined rather than never heard of.
 *
 * Every state is explicit. The card used to be gated on `active &&`, which made
 * "still loading", "the API is down", and "you have no plan yet" render as the
 * same blank space — so during an outage the shell silently told a user with a
 * live plan that they had no budget, in a product whose first principle is that
 * remaining budget stays legible on every surface.
 */

type Pace = 'over' | 'hot' | 'on-track';

interface Readout {
  planId: string;
  periodLabel: string;
  daysLeft: number | null;
  remaining: number;
  totalBudget: number;
  spentPercent: number;
  perMeal: number;
  isOver: boolean;
  pace: Pace;
}

const PACE_LABEL: Record<Pace, string> = {
  over: 'Over budget',
  hot: 'Running hot',
  'on-track': 'On track',
};

/** Pace ink. Amber is the documented band between "on track" and "over". */
const PACE_TEXT: Record<Pace, string> = {
  over: 'text-tomato-ink',
  hot: 'text-amber-ink',
  'on-track': 'text-green-deep',
};

/**
 * Spending faster than the period is elapsing, by enough to be signal rather
 * than noise. Ten points of slack keeps a user who front-loads one big lunch
 * from being told they are off track on day one of seven.
 */
const PACE_SLACK = 0.1;

function toReadout(active: ActiveBudgetPlanResponse): Readout {
  // The pin-adjusted budgetState is the same source the dashboard budget card
  // reads, so the figure is identical everywhere in the shell; fall back to
  // plan totals. Remaining stays honest — negative when over — and the copy
  // labels it rather than clamping the number to zero.
  const bs = active.budgetState;
  const totalBudget = bs?.totalBudget ?? active.plan.totalBudget ?? 0;
  const spent = bs?.amountSpent ?? active.plan.spentAmount ?? 0;
  const remaining = bs ? bs.amountRemaining : totalBudget - spent;
  const spentPercent = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
  const isOver = remaining < 0;

  const elapsed = periodElapsedFraction(active.plan.startDate, active.plan.endDate);
  const spentFraction = totalBudget > 0 ? spent / totalBudget : 0;
  const pace: Pace = isOver
    ? 'over'
    : elapsed !== null && spentFraction > elapsed + PACE_SLACK
      ? 'hot'
      : 'on-track';

  return {
    planId: active.plan.id,
    periodLabel: active.plan.planType === 'monthly' ? 'Monthly budget' : 'Weekly budget',
    daysLeft: daysRemainingInPeriod(active.plan.endDate),
    remaining,
    totalBudget,
    spentPercent,
    perMeal: bs?.avgBudgetPerRemainingMeal ?? 0,
    isOver,
    pace,
  };
}

function daysLabel(days: number | null): string | null {
  if (days === null) return null;
  // 0 means the period runs out at the end of today, not that it is over — the
  // plan is still active, and the remaining budget still has to cover today.
  if (days === 0) return 'Last day';
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

/** The bar is decoration for a number stated as text beside it — see callers. */
function ProgressBar({
  spentPercent,
  isOver,
  className,
}: {
  spentPercent: number;
  isOver: boolean;
  className: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div aria-hidden className={`overflow-hidden rounded-full bg-sage ${className}`}>
      <motion.div
        className={`h-full rounded-full ${isOver || spentPercent >= 90 ? 'bg-tomato' : 'bg-green'}`}
        initial={prefersReducedMotion ? false : { width: '0%' }}
        animate={{ width: `${Math.min(100, Math.max(0, spentPercent))}%` }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }
        }
      />
    </div>
  );
}

// ─── Rail variant (desktop sidebar) ─────────────────────────────────────────

const RAIL_SHELL = 'block rounded-2xl border border-sage bg-canvas p-4 text-left';

function RailFrame({ children }: { children: React.ReactNode }) {
  return <div className={RAIL_SHELL}>{children}</div>;
}

function RailSkeleton() {
  return (
    <RailFrame>
      <div className="animate-pulse space-y-2.5">
        <div className="h-3 w-28 rounded bg-sage" />
        <div className="h-7 w-32 rounded bg-sage" />
        <div className="h-3 w-24 rounded bg-sage" />
        <div className="h-1.5 w-full rounded-full bg-sage" />
      </div>
      <span className="sr-only">Loading your remaining budget</span>
    </RailFrame>
  );
}

function RailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-tomato/30 bg-tomato/[0.06] p-4 text-tomato-ink"
    >
      <p className="flex items-start gap-2 text-[13px] font-medium">
        <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        Couldn&apos;t load your budget
      </p>
      <p className="mt-1 text-xs text-tomato-ink/80">
        The figure below your plan is missing, not zero.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={`mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-tomato/40 bg-white px-3 text-[12px] font-semibold text-tomato-ink transition-colors hover:bg-tomato/10 ${FOCUS_RING}`}
      >
        <RotateCw aria-hidden className="h-3.5 w-3.5" />
        Try again
      </button>
    </div>
  );
}

function RailEmpty() {
  return (
    <Link
      // `/plans` is where every other surface sends a user to create one; there
      // is no `/plans/new` route and a rail that invented one would be a dead
      // end at the exact moment the app is asking for a first commitment.
      href="/plans"
      className={`${RAIL_SHELL} border-dashed transition-colors hover:border-green-deep hover:bg-white ${FOCUS_RING}`}
    >
      <p className="font-display text-sm font-semibold text-charcoal">No budget yet</p>
      <p className="mt-1 text-xs text-slate">
        Set a weekly or monthly amount and BudgetBite plans meals that fit it.
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-deep">
        Start a plan
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

function RailReadout({ r }: { r: Readout }) {
  const days = daysLabel(r.daysLeft);
  return (
    <Link
      href={`/plans/${r.planId}`}
      className={`${RAIL_SHELL} transition-colors hover:border-green-deep hover:bg-white ${FOCUS_RING}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">
        {r.periodLabel}
        {days && (
          <>
            {' · '}
            <span className="tabular-nums">{days}</span>
          </>
        )}
      </p>

      <p
        className={`mt-2 font-display text-3xl font-bold tabular-nums tracking-tight ${
          r.isOver ? 'text-tomato-ink' : 'text-charcoal'
        }`}
      >
        {formatPKR(Math.abs(r.remaining))}
      </p>
      <p className="mt-0.5 text-xs text-slate">
        {r.isOver ? (
          <>over your {formatPKR(r.totalBudget)} budget</>
        ) : (
          <>left of {formatPKR(r.totalBudget)}</>
        )}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <ProgressBar spentPercent={r.spentPercent} isOver={r.isOver} className="h-1.5 flex-1" />
        <span
          className={`text-xs font-bold tabular-nums ${r.isOver ? 'text-tomato-ink' : 'text-green-deep'}`}
        >
          {r.spentPercent}%
        </span>
      </div>

      <p className="mt-2.5 text-xs">
        {r.perMeal > 0 && (
          <span className="tabular-nums text-slate">{formatPKR(r.perMeal)}/meal · </span>
        )}
        <span className={`font-semibold ${PACE_TEXT[r.pace]}`}>{PACE_LABEL[r.pace]}</span>
      </p>
    </Link>
  );
}

// ─── Pill variant (header, below lg) ────────────────────────────────────────

function PillSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-sage bg-white px-3.5 py-1.5 sm:px-4">
      <span className="sr-only">Loading your remaining budget</span>
      <span aria-hidden className="h-3 w-8 animate-pulse rounded bg-sage" />
      <span aria-hidden className="h-3.5 w-16 animate-pulse rounded bg-sage" />
    </div>
  );
}

function PillError({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border border-tomato/40 bg-white px-3.5 text-xs font-semibold text-tomato-ink transition-colors hover:bg-tomato/10 sm:min-h-9 ${FOCUS_RING_ON_CANVAS}`}
    >
      <TriangleAlert aria-hidden className="h-3.5 w-3.5" />
      Budget unavailable
      <RotateCw aria-hidden className="h-3.5 w-3.5" />
    </button>
  );
}

function PillEmpty() {
  return (
    <Link
      href="/plans"
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-sage-edge bg-white px-3.5 text-xs font-semibold text-green-deep transition-colors hover:bg-canvas sm:min-h-9 ${FOCUS_RING_ON_CANVAS}`}
    >
      Start a plan
      <span aria-hidden>→</span>
    </Link>
  );
}

function PillReadout({ r }: { r: Readout }) {
  return (
    <Link
      href={`/plans/${r.planId}`}
      // `whitespace-nowrap` and `shrink-0`: at 390px the amount used to wrap
      // between its currency mark and its digits — "₨" on one line, "12,000" on
      // the next — which is the worst possible place for a money figure to
      // break, on the device where most spend-logging happens.
      className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-sage bg-white px-3 shadow-sm transition-colors hover:border-green-deep sm:min-h-9 sm:gap-3 sm:px-4 ${FOCUS_RING_ON_CANVAS}`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate">
        {r.isOver ? 'Over' : 'Left'}
      </span>
      <span
        className={`font-display text-sm font-semibold tabular-nums ${
          r.isOver ? 'text-tomato-ink' : 'text-charcoal'
        }`}
      >
        {formatPKR(Math.abs(r.remaining))}
      </span>
      {r.perMeal > 0 && (
        <span className="text-[11px] font-medium tabular-nums text-slate">
          · {formatPKR(r.perMeal)}
          <span className="text-[10px]">/meal</span>
        </span>
      )}
      <ProgressBar
        spentPercent={r.spentPercent}
        isOver={r.isOver}
        className="hidden h-1.5 w-20 sm:block"
      />
      <span className="hidden text-[10px] font-medium tabular-nums text-slate sm:block">
        {r.spentPercent}%
      </span>
    </Link>
  );
}

// ─── Entry point ────────────────────────────────────────────────────────────

/**
 * `null` data means the API answered "no active plan" (a 404, mapped by
 * `orNull`) — a real, expected state that deserves an invitation rather than
 * the empty space it used to get. A thrown error is a different thing entirely
 * and says so.
 */
export function BudgetReadout({ variant }: { variant: 'rail' | 'pill' }) {
  const { data: active, isPending, isError, refetch } = useActiveBudgetPlan();
  const rail = variant === 'rail';

  if (isPending) return rail ? <RailSkeleton /> : <PillSkeleton />;
  if (isError) {
    const retry = () => void refetch();
    return rail ? <RailError onRetry={retry} /> : <PillError onRetry={retry} />;
  }
  if (!active) return rail ? <RailEmpty /> : <PillEmpty />;

  const r = toReadout(active);
  return rail ? <RailReadout r={r} /> : <PillReadout r={r} />;
}
