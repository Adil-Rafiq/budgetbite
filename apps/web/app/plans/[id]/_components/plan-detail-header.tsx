'use client';

import Link from 'next/link';
import type { BudgetPlanDetail } from '@repo/shared';

type StatusTone = 'fathom' | 'soft' | 'pulse';

const statusTone: Record<BudgetPlanDetail['status'], StatusTone> = {
  active: 'fathom',
  completed: 'soft',
  cancelled: 'pulse',
};

const TONE_CLASS: Record<StatusTone, { pill: string; dot: string }> = {
  fathom: { pill: 'bg-fathom/[0.08] text-fathom', dot: 'bg-fathom' },
  soft: { pill: 'bg-soft/[0.08] text-soft', dot: 'bg-soft' },
  pulse: { pill: 'bg-pulse/[0.08] text-pulse', dot: 'bg-pulse' },
};

const dateFormatter = new Intl.DateTimeFormat('en-PK', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function PlanDetailHeader({ plan }: { plan: BudgetPlanDetail }) {
  const dateRange = `${dateFormatter.format(new Date(plan.startDate))} – ${dateFormatter.format(new Date(plan.endDate))}`;
  const tone = statusTone[plan.status];

  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/plans"
        className="inline-flex w-fit items-center gap-1.5 text-[12px] text-ink transition hover:opacity-80"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        ← back to plans
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div
            className="text-[10px] uppercase text-fathom"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
          >
            plan · /plans/{plan.id.slice(0, 8)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="capitalize text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3.6vw, 40px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
            >
              {plan.planType} plan
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] uppercase ${TONE_CLASS[tone].pill}`}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${TONE_CLASS[tone].dot}`} />
              {plan.status}
            </span>
          </div>
          <p
            className="text-[13px] text-ink"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {dateRange}
          </p>
        </div>
      </div>
    </div>
  );
}
