'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useBudgetPlans } from '@/hooks/use-budget-plan';
import { Stagger, StaggerItem, Pill } from '@/components/motion';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const AMBER = '#b8741a';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

const formatDate = (dateStr: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(dateStr).toLocaleDateString('en-PK', opts);

const statusTint: Record<string, string> = {
  active: FATHOM,
  completed: SOFT,
  cancelled: PULSE,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlansListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-5"
          style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 animate-pulse rounded" style={{ background: LUMEN }} />
            <div className="h-5 w-16 animate-pulse rounded-full" style={{ background: LUMEN }} />
          </div>
          <div className="mt-4 h-7 w-32 animate-pulse rounded" style={{ background: LUMEN }} />
          <div className="mt-3 h-2 w-full animate-pulse rounded-full" style={{ background: LUMEN }} />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-10 animate-pulse rounded-lg" style={{ background: LUMEN }} />
            <div className="h-10 animate-pulse rounded-lg" style={{ background: LUMEN }} />
            <div className="h-10 animate-pulse rounded-lg" style={{ background: LUMEN }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlansListError({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl p-4 text-[13px]"
      style={{ background: 'rgba(127,28,52,0.06)', border: `1px solid ${PULSE}`, color: PULSE }}
    >
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      <p>{message}</p>
    </div>
  );
}

function PlansListEmpty() {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        background: WHITE,
        border: `1px dashed ${LUMEN_DK}`,
      }}
    >
      <p className="text-[14px]" style={{ color: MUTED }}>
        No plans yet.
        <span
          className="ml-1.5 text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
        >
          create one to get started.
        </span>
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
          const tint = statusTint[plan.status] ?? SOFT;
          const code = String(idx + 1 + page * PAGE_SIZE).padStart(2, '0');

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
                className="rounded-2xl p-5"
                style={{
                  background: WHITE,
                  border: `1px solid ${LUMEN_DK}`,
                  boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
                }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-[10px] uppercase"
                    style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
                  >
                    {code} · {plan.planType}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: `${tint}14`,
                      color: tint,
                      letterSpacing: '0.18em',
                    }}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: tint }} />
                    {plan.status}
                  </span>
                </div>

                <div
                  className="mt-4 truncate capitalize"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: VAST,
                    lineHeight: 1.05,
                  }}
                >
                  {plan.planType} plan
                </div>

                <div
                  className="mt-1 text-[12px]"
                  style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                >
                  {formatDate(plan.startDate, { month: 'short', day: 'numeric' })}
                  {' → '}
                  {formatDate(plan.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                <div className="mt-4">
                  <div
                    className="mb-1.5 flex items-center justify-between text-[12px]"
                    style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                  >
                    <span>₨ {spent.toLocaleString()} spent</span>
                    <span style={{ color: VAST, fontWeight: 600 }}>
                      ₨ {plan.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: LUMEN_DK }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${spentPercent}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                      style={{
                        background: `linear-gradient(90deg, ${FATHOM}, ${AMBER})`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Budget', value: `${(plan.totalBudget / 1000).toFixed(0)}k` },
                    { label: 'Spent', value: `${(spent / 1000).toFixed(1)}k` },
                    {
                      label: 'Left',
                      value: remaining > 0 ? `${(remaining / 1000).toFixed(1)}k` : '0',
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-lg px-2 py-1.5"
                      style={{ background: LUMEN, border: `1px solid ${LUMEN_DK}` }}
                    >
                      <p
                        className="text-[9px] uppercase"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: SOFT,
                          letterSpacing: '0.18em',
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          fontWeight: 600,
                          color: VAST,
                        }}
                      >
                        ₨ {value}
                      </p>
                    </div>
                  ))}
                </div>

                {plan.mealTypes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
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
              </motion.div>
            </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p
            className="text-[11px]"
            style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
          >
            page {page + 1} of {totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <Pill
              variant="ghost"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!hasPrev || isFetching}
              style={{ padding: '6px 16px', fontSize: 12 }}
            >
              ← prev
            </Pill>
            <Pill
              variant="ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || isFetching}
              style={{ padding: '6px 16px', fontSize: 12 }}
            >
              next →
            </Pill>
          </div>
        </div>
      )}
    </div>
  );
}
