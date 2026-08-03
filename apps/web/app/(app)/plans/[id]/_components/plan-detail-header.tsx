'use client';

import Link from 'next/link';
import { planSubtitle, planTitle } from '@/lib/budget-plan/labels';
import { FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import type { BudgetPlanDetail } from '@repo/shared';

type StatusTone = 'active' | 'completed' | 'cancelled';

const statusTone: Record<BudgetPlanDetail['status'], StatusTone> = {
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

const TONE_CLASS: Record<StatusTone, { pill: string; dot: string }> = {
  active: { pill: 'bg-teal/10 text-teal-ink', dot: 'bg-teal' },
  completed: { pill: 'bg-slate/10 text-slate', dot: 'bg-slate' },
  cancelled: { pill: 'bg-tomato/10 text-tomato-ink', dot: 'bg-tomato' },
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
        className={`inline-flex w-fit items-center gap-1.5 rounded text-[12px] text-slate transition hover:text-teal-ink ${FOCUS_RING_ON_CANVAS}`}
      >
        ← Back to plans
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {/* The eyebrow used to read `Plan · 3f2a9b1c` — a UUID fragment was
              the only per-plan identity a user was ever given. */}
          <div className="text-xs font-semibold uppercase tracking-widest text-teal-ink">
            {planSubtitle(plan)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.05] tracking-tight text-charcoal">
              {planTitle(plan)}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${TONE_CLASS[tone].pill}`}
            >
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 rounded-full ${TONE_CLASS[tone].dot}`}
              />
              {plan.status}
            </span>
          </div>
          <p className="text-[13px] text-slate">{dateRange}</p>
        </div>
      </div>
    </div>
  );
}
