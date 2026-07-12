'use client';

import Link from 'next/link';
import type { BudgetPlanDetail } from '@repo/shared';

type StatusTone = 'active' | 'completed' | 'cancelled';

const statusTone: Record<BudgetPlanDetail['status'], StatusTone> = {
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

const TONE_CLASS: Record<StatusTone, { pill: string; dot: string }> = {
  active: { pill: 'bg-green/10 text-dark-green', dot: 'bg-green' },
  completed: { pill: 'bg-slate/10 text-slate', dot: 'bg-slate' },
  cancelled: { pill: 'bg-tomato/10 text-tomato', dot: 'bg-tomato' },
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
        className="inline-flex w-fit items-center gap-1.5 text-[12px] text-slate transition hover:text-green"
      >
        ← Back to plans
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-green">
            Plan · {plan.id.slice(0, 8)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold capitalize leading-[1.05] tracking-tight text-charcoal">
              {plan.planType} plan
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${TONE_CLASS[tone].pill}`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${TONE_CLASS[tone].dot}`} />
              {plan.status}
            </span>
          </div>
          <p className="text-[13px] text-slate">{dateRange}</p>
        </div>
      </div>
    </div>
  );
}
