'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useBudgetPlans } from '@/hooks/use-budget-plan';
import { Stagger, StaggerItem } from '@/components/motion';

const formatDate = (dateStr: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(dateStr).toLocaleDateString('en-PK', opts);

const formatPkr = (n: number) => (n >= 1000 ? `₨ ${(n / 1000).toFixed(1)}k` : `₨ ${Math.round(n)}`);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type StatusTone = 'active' | 'completed' | 'cancelled';

const statusTone: Record<string, StatusTone> = {
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

const STATUS_CLASS: Record<StatusTone, { pill: string; dot: string; fill: string }> = {
  active: { pill: 'bg-green/10 text-dark-green', dot: 'bg-green', fill: 'bg-green' },
  completed: { pill: 'bg-slate/10 text-slate', dot: 'bg-slate', fill: 'bg-slate/70' },
  cancelled: { pill: 'bg-tomato/10 text-tomato', dot: 'bg-tomato', fill: 'bg-tomato' },
};

function PlansListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-sage bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-sage" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-sage" />
          </div>
          <div className="mt-4 h-7 w-32 animate-pulse rounded bg-sage" />
          <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-sage" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-10 animate-pulse rounded-lg bg-sage" />
            <div className="h-10 animate-pulse rounded-lg bg-sage" />
            <div className="h-10 animate-pulse rounded-lg bg-sage" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlansListError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-tomato/30 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
      <span className="font-semibold">!</span>
      <p>{message}</p>
    </div>
  );
}

function PlansListEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-sage bg-white p-8 text-center">
      <p className="text-sm text-slate">
        No plans yet.
        <span className="ml-1.5 text-[12px] text-slate/60">Create one to get started.</span>
      </p>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function PlansList() {
  const [page, setPage] = useState(0);
  const {
    data: plansWithMeta,
    isLoading,
    isFetching,
    error,
  } = useBudgetPlans({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });

  if (isLoading) return <PlansListSkeleton />;

  if (error) return <PlansListError message={`Failed to load budget plan: ${error.message}`} />;

  if (!plansWithMeta || !plansWithMeta.data?.length) return page === 0 ? <PlansListEmpty /> : null;

  const { data: plans, meta } = plansWithMeta;
  const totalPages = Math.max(1, Math.ceil(meta.total / PAGE_SIZE));
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <div className="flex flex-col gap-4">
      <Stagger className="grid gap-4 sm:grid-cols-2" stagger={0.06}>
        {plans.map((plan, idx) => {
          const spent = plan.spentAmount;
          const spentPercent = Math.min(100, Math.round((spent / plan.totalBudget) * 100));
          const remaining = plan.totalBudget - spent;
          const tone = statusTone[plan.status] ?? 'completed';
          const code = String(idx + 1 + page * PAGE_SIZE).padStart(2, '0');

          const now = Date.now();
          const startMs = new Date(plan.startDate).getTime();
          const endMs = new Date(plan.endDate).getTime();
          const elapsedToMs = Math.min(now, endMs);
          const daysElapsed = Math.max(1, Math.ceil((elapsedToMs - startMs) / MS_PER_DAY));
          const daysLeft =
            plan.status === 'active' ? Math.max(0, Math.ceil((endMs - now) / MS_PER_DAY)) : 0;
          const dailyAvg = spent / daysElapsed;

          return (
            <StaggerItem key={plan.id}>
              <Link
                href={`/plans/${plan.id}`}
                className="group block rounded-2xl"
                aria-label={`Open ${plan.planType} plan details`}
              >
                <motion.div
                  whileHover={{ y: -3, boxShadow: '0 10px 24px rgba(0,0,0,0.07)' }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="rounded-2xl border border-sage bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate/60">
                      {code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${STATUS_CLASS[tone].pill}`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_CLASS[tone].dot}`}
                      />
                      {plan.status}
                    </span>
                  </div>

                  <div className="mt-4 truncate font-display text-xl font-semibold capitalize leading-[1.05] tracking-tight text-charcoal">
                    {plan.planType} plan
                  </div>

                  <div className="mt-1 text-[12px] text-slate">
                    {formatDate(plan.startDate, { month: 'short', day: 'numeric' })}
                    {' → '}
                    {formatDate(plan.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[12px] text-slate">
                      <span>₨ {spent.toLocaleString()} spent</span>
                      <span className="font-semibold text-charcoal">
                        of ₨ {plan.totalBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sage/50">
                      <motion.div
                        className={`h-full rounded-full ${STATUS_CLASS[tone].fill}`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${spentPercent}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      {
                        label: 'Remaining',
                        value: remaining > 0 ? formatPkr(remaining) : '₨ 0',
                      },
                      { label: 'Daily avg', value: formatPkr(dailyAvg) },
                      { label: 'Days left', value: String(daysLeft) },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-lg border border-sage bg-canvas px-2 py-1.5"
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate/60">
                          {label}
                        </p>
                        <p className="font-display text-sm font-semibold text-charcoal">{value}</p>
                      </div>
                    ))}
                  </div>

                  {plan.mealTypes.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {plan.mealTypes.map((mt) => (
                        <span
                          key={mt.id}
                          className="rounded-full border border-sage bg-canvas px-2.5 py-0.5 text-[10px] capitalize text-slate"
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
            Page {page + 1} of {totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!hasPrev || isFetching}
              className="inline-flex items-center rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || isFetching}
              className="inline-flex items-center rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
