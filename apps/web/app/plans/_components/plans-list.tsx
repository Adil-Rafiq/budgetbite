'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useBudgetPlans } from '@/hooks/use-budget-plan';
import { Stagger, StaggerItem } from '@/components/motion';
import { Pill } from '@/components/ui/pill';

const formatDate = (dateStr: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(dateStr).toLocaleDateString('en-PK', opts);

const formatPkr = (n: number) =>
  n >= 1000 ? `₨ ${(n / 1000).toFixed(1)}k` : `₨ ${Math.round(n)}`;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type StatusTone = 'fathom' | 'soft' | 'pulse';

const statusTone: Record<string, StatusTone> = {
  active: 'fathom',
  completed: 'soft',
  cancelled: 'pulse',
};

const STATUS_CLASS: Record<StatusTone, { pill: string; dot: string }> = {
  fathom: { pill: 'bg-fathom/[0.08] text-fathom', dot: 'bg-fathom' },
  soft: { pill: 'bg-soft/[0.08] text-soft', dot: 'bg-soft' },
  pulse: { pill: 'bg-pulse/[0.08] text-pulse', dot: 'bg-pulse' },
};

function PlansListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-lumen-dk bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-lumen" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-lumen" />
          </div>
          <div className="mt-4 h-7 w-32 animate-pulse rounded bg-lumen" />
          <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-lumen" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-10 animate-pulse rounded-lg bg-lumen" />
            <div className="h-10 animate-pulse rounded-lg bg-lumen" />
            <div className="h-10 animate-pulse rounded-lg bg-lumen" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlansListError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-pulse bg-pulse/[0.06] p-4 text-[13px] text-pulse">
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      <p>{message}</p>
    </div>
  );
}

function PlansListEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-lumen-dk bg-white p-8 text-center">
      <p className="text-[14px] text-ink">
        No plans yet.
        <span className="ml-1.5 text-[12px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
          create one to get started.
        </span>
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
          const tone = statusTone[plan.status] ?? 'soft';
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
                  className="rounded-2xl border border-lumen-dk bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="text-[10px] uppercase text-soft"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
                    >
                      {code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] uppercase ${STATUS_CLASS[tone].pill}`}
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_CLASS[tone].dot}`}
                      />
                      {plan.status}
                    </span>
                  </div>

                  <div
                    className="mt-4 truncate capitalize text-vast"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.05,
                    }}
                  >
                    {plan.planType} plan
                  </div>

                  <div
                    className="mt-1 text-[12px] text-ink"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatDate(plan.startDate, { month: 'short', day: 'numeric' })}
                    {' → '}
                    {formatDate(plan.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  <div className="mt-4">
                    <div
                      className="mb-1.5 flex items-center justify-between text-[12px] text-ink"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      <span>₨ {spent.toLocaleString()} spent</span>
                      <span className="font-semibold text-vast">
                        of ₨ {plan.totalBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-lumen-dk">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${spentPercent}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                        style={{
                          background:
                            'linear-gradient(90deg, var(--color-fathom), var(--color-amber))',
                        }}
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
                        className="rounded-lg border border-lumen-dk bg-lumen px-2 py-1.5"
                      >
                        <p
                          className="text-[9px] uppercase text-soft"
                          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-vast"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {plan.mealTypes.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
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
                </motion.div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
            page {page + 1} of {totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <Pill
              variant="ghost"
              size="xs"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!hasPrev || isFetching}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ← prev
            </Pill>
            <Pill
              variant="ghost"
              size="xs"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || isFetching}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              next →
            </Pill>
          </div>
        </div>
      )}
    </div>
  );
}
