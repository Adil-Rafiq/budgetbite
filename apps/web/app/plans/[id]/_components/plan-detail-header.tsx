'use client';

import Link from 'next/link';
import type { BudgetPlanDetail } from '@repo/shared';

const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const VAST = '#1a1a1a';
const MUTED = '#71716a';
const SOFT = '#a6a691';

const statusTint: Record<BudgetPlanDetail['status'], string> = {
  active: FATHOM,
  completed: SOFT,
  cancelled: PULSE,
};

const dateFormatter = new Intl.DateTimeFormat('en-PK', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function PlanDetailHeader({ plan }: { plan: BudgetPlanDetail }) {
  const dateRange = `${dateFormatter.format(new Date(plan.startDate))} – ${dateFormatter.format(new Date(plan.endDate))}`;
  const tint = statusTint[plan.status];

  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/plans"
        className="inline-flex w-fit items-center gap-1.5 text-[12px] transition hover:opacity-80"
        style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
      >
        ← back to plans
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex flex-col gap-2">
          <div
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            plan · /plans/{plan.id.slice(0, 8)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="capitalize"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3.6vw, 40px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
                color: VAST,
              }}
            >
              {plan.planType} plan
            </h1>
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
          <p
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
          >
            {dateRange}
          </p>
        </div>
      </div>
    </div>
  );
}
