'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import type { BudgetPlanResponse } from '@repo/shared';
import { useBudgetPlans } from '@/hooks/use-budget-plan';
import { useNewPlanLauncher } from '@/app/(app)/plans/_context/new-plan-launcher';
import { Stagger, StaggerItem } from '@/components/motion';
import { DataError } from '@/components/data-error';
import { BudgetProgress } from '@/components/budget/budget-progress';
import { RemainingAmount } from '@/components/budget/remaining-amount';
import { StatTile } from '@/components/budget/stat-tile';
import { formatPKR } from '@/lib/currency';
import { daysRemainingInPeriod } from '@/lib/date';
import { planSubtitle, planTitle } from '@/lib/budget-plan/labels';
import { getSpendingHealth } from '@/lib/budget-plan/spending-health';
import { FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';

const formatDate = (dateStr: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(dateStr).toLocaleDateString('en-PK', opts);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type PlanStatus = BudgetPlanResponse['status'];

const STATUS_CLASS: Record<PlanStatus, { pill: string; dot: string }> = {
  active: { pill: 'bg-teal/10 text-teal-ink', dot: 'bg-teal' },
  completed: { pill: 'bg-slate/10 text-slate', dot: 'bg-slate' },
  cancelled: { pill: 'bg-tomato/10 text-tomato-ink', dot: 'bg-tomato' },
};

/** Falls back visibly rather than painting an unrecognised status as "completed". */
const statusClassFor = (status: PlanStatus) =>
  STATUS_CLASS[status] ?? { pill: 'bg-slate/10 text-slate', dot: 'bg-slate' };

const FILTERS = [
  { value: undefined, label: 'All' },
  { value: 'active' as const, label: 'Active' },
  { value: 'completed' as const, label: 'Completed' },
  { value: 'cancelled' as const, label: 'Cancelled' },
];

function PlansListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-sand bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-sand" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-sand" />
          </div>
          <div className="mt-4 h-7 w-32 animate-pulse rounded bg-sand" />
          <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-sand" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-10 animate-pulse rounded-lg bg-sand" />
            <div className="h-10 animate-pulse rounded-lg bg-sand" />
            <div className="h-10 animate-pulse rounded-lg bg-sand" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The empty state carries the action. It used to be a dashed box with the copy
 * "Create one to get started" and no control inside it — the button lived 400px
 * away in the header corner, and this is the screen the dashboard's first-run
 * card sends people to.
 */
function PlansListEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  const requestNewPlan = useNewPlanLauncher();

  if (filtered) {
    return (
      <div className="rounded-2xl border border-dashed border-sand bg-surface p-8 text-center">
        <p className="font-display text-lg font-semibold tracking-tight text-charcoal">
          No plans with this status.
        </p>
        <button
          type="button"
          onClick={onClear}
          className={`mt-3 min-h-11 rounded-xl border border-sand bg-surface px-4 text-[13px] font-semibold text-teal-ink transition-colors hover:border-teal-ink ${FOCUS_RING_ON_CANVAS}`}
        >
          Show all plans
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sand bg-surface p-8 text-center">
      <p className="font-display text-xl font-semibold tracking-tight text-charcoal">
        Set your first budget.
      </p>
      <p className="max-w-[380px] text-[13px] text-slate">
        Pick an amount and which meals it covers. We&apos;ll suggest meals from restaurants near you
        that fit inside it.
      </p>
      <button
        type="button"
        onClick={requestNewPlan}
        className={`mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-deep px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-deeper ${FOCUS_RING_ON_CANVAS}`}
      >
        New plan
        <Plus aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function PlansList() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<PlanStatus | undefined>(undefined);
  const prefersReducedMotion = useReducedMotion();

  const {
    data: plansWithMeta,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useBudgetPlans({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...(status ? { status } : {}),
  });

  const total = plansWithMeta?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // A shrinking list used to strand the user: cancel enough plans while on page
  // 4 and the component returned `null` — a blank screen with no cards, no
  // pagination, and no way back short of the browser's own controls.
  useEffect(() => {
    if (page > 0 && page >= totalPages) setPage(totalPages - 1);
  }, [page, totalPages]);

  if (isLoading) return <PlansListSkeleton />;

  if (error) {
    return (
      <DataError message="We couldn't load your budget plans just now." onRetry={() => refetch()} />
    );
  }

  const plans = plansWithMeta?.data ?? [];
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  const filters = (
    <div role="group" aria-label="Filter plans by status" className="flex flex-wrap gap-1.5">
      {FILTERS.map((filter) => {
        const active = status === filter.value;
        return (
          <button
            key={filter.label}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setStatus(filter.value);
              setPage(0);
            }}
            className={`min-h-11 rounded-full border px-3.5 text-[12px] font-medium transition-colors ${FOCUS_RING_ON_CANVAS} ${
              active
                ? 'border-teal-ink bg-teal/10 font-semibold text-teal-ink'
                : 'border-sand bg-surface text-slate hover:border-teal-ink/50'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );

  if (plans.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {status && filters}
        <PlansListEmpty
          filtered={!!status}
          onClear={() => {
            setStatus(undefined);
            setPage(0);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {filters}

      <Stagger
        // A single plan used to float in half the width with dead space beside
        // it; one column reads as deliberate.
        className={`grid gap-4 ${plans.length === 1 ? '' : 'sm:grid-cols-2'}`}
        stagger={0.06}
      >
        {plans.map((plan) => {
          const spent = plan.spentAmount;
          const spentPercent =
            plan.totalBudget > 0 ? Math.round((spent / plan.totalBudget) * 100) : 0;
          const remaining = plan.totalBudget - spent;
          const health = getSpendingHealth({ spent, total: plan.totalBudget, remaining });
          const tone = statusClassFor(plan.status);

          const now = Date.now();
          const startMs = new Date(plan.startDate).getTime();
          const endMs = new Date(plan.endDate).getTime();
          const elapsedToMs = Math.min(now, endMs);
          const daysElapsed = Math.max(1, Math.ceil((elapsedToMs - startMs) / MS_PER_DAY));
          const isActive = plan.status === 'active';
          // Shared with the sidebar readout and the dashboard budget card.
          // Computed from `new Date(endDate)` here, this counted from UTC
          // midnight and could disagree with them by a day before 5 AM local.
          const daysLeft = isActive ? (daysRemainingInPeriod(plan.endDate) ?? 0) : 0;
          const dailyAvg = spent / daysElapsed;

          return (
            <StaggerItem key={plan.id}>
              <Link
                href={`/plans/${plan.id}`}
                // No `aria-label` override: it replaced the card's own content,
                // so ten plans announced ten identical "Open monthly plan
                // details" links with the dates and amounts thrown away.
                className={`group block rounded-2xl ${FOCUS_RING_ON_CANVAS}`}
              >
                <motion.div
                  whileHover={
                    prefersReducedMotion ? undefined : { y: -3, boxShadow: 'var(--elevation-lift)' }
                  }
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="rounded-2xl border border-sand bg-surface p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* The period is what distinguishes one plan from
                          another, so it is the headline. The old title was
                          "{planType} plan" — identical on every card, at the
                          largest size on it. */}
                      <div className="truncate font-display text-xl font-semibold leading-[1.05] tracking-tight text-charcoal">
                        {planTitle(plan)}
                      </div>
                      <div className="mt-1 text-[12px] text-slate">{planSubtitle(plan)}</div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.pill}`}
                    >
                      <span
                        aria-hidden
                        className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`}
                      />
                      {plan.status}
                    </span>
                  </div>

                  <div className="mt-1.5 text-[11px] text-slate/70">
                    {formatDate(plan.startDate, { month: 'short', day: 'numeric' })}
                    {' → '}
                    {formatDate(plan.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[12px] text-slate">
                      <span className="tabular-nums">{formatPKR(spent)} spent</span>
                      <span className="font-semibold tabular-nums text-charcoal">
                        of {formatPKR(plan.totalBudget)}
                      </span>
                    </div>
                    <BudgetProgress
                      spentPercent={spentPercent}
                      health={health}
                      label={`${planTitle(plan)}: share of budget spent`}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {/* Was `formatPKR(Math.max(0, remaining))` — a user who
                        overspent read "Remaining ₨ 0" here while the sidebar
                        beside it correctly said "over". */}
                    <StatTile
                      label={remaining < 0 ? 'Over by' : 'Remaining'}
                      value={<RemainingAmount remaining={remaining} size="sm" />}
                    />
                    <StatTile label="Daily avg" value={formatPKR(dailyAvg)} />
                    {isActive ? (
                      <StatTile label="Days left" value={String(daysLeft)} />
                    ) : (
                      <StatTile label="Ran for" value={`${daysElapsed} days`} />
                    )}
                  </div>

                  {plan.mealTypes.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
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
                </motion.div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate">
            Page {page + 1} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!hasPrev || isFetching}
              className={`inline-flex min-h-11 items-center rounded-lg border border-sand bg-surface px-3 text-[12px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING_ON_CANVAS}`}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || isFetching}
              className={`inline-flex min-h-11 items-center rounded-lg border border-sand bg-surface px-3 text-[12px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING_ON_CANVAS}`}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
