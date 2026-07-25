'use client';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { FadeUp } from '@/components/motion';
import { NoPlanState } from '@/components/dashboard/no-plan-state';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { MealSlots } from '@/components/dashboard/meal-slots';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { RecommendCard } from '@/components/dashboard/recommend-card';

export function DashboardBody() {
  const { data, isLoading } = useActiveBudgetPlan();
  const hasPlan = !!data?.plan;

  // First run: no active plan, and we're sure (not mid-load). Show one focused
  // starting point rather than four separate "no plan yet" fragments.
  if (!isLoading && !hasPlan) {
    return (
      <div className="mx-auto w-full max-w-[1180px]">
        <NoPlanState />
      </div>
    );
  }

  return (
    <FadeUp>
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
        <header className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate">
              Today · Your plan
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-charcoal sm:text-4xl">
            Welcome back.
          </h1>
          <p className="max-w-[540px] text-[15px] leading-relaxed text-slate">
            Choose today&apos;s meals and keep an eye on your budget — no spreadsheets, no math.
          </p>
        </header>

        {/* Primary task first: choose today's meals. */}
        <MealSlots />

        {/* Budget standing — the frame around the decision above. */}
        <SummaryCards />

        <RecentActivity />
        <RecommendCard />
      </div>
    </FadeUp>
  );
}
