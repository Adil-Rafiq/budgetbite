'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BudgetPlanDetail } from '@repo/shared';

const statusStyles: Record<BudgetPlanDetail['status'], string> = {
  active: 'bg-accent/10 text-accent border-0',
  completed: 'bg-chart-3/10 text-chart-3 border-0',
  cancelled: 'bg-destructive/10 text-destructive border-0',
};

const dateFormatter = new Intl.DateTimeFormat('en-PK', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function PlanDetailHeader({ plan }: { plan: BudgetPlanDetail }) {
  const dateRange = `${dateFormatter.format(new Date(plan.startDate))} – ${dateFormatter.format(new Date(plan.endDate))}`;

  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/plans"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to plans
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {plan.planType} Plan
            </h1>
            <Badge variant="secondary" className={statusStyles[plan.status]}>
              {plan.status}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateRange}
          </p>
        </div>
      </div>
    </div>
  );
}
