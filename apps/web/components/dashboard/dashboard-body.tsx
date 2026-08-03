'use client';

import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { FadeUp } from '@/components/motion';
import { DataError } from '@/components/data-error';
import { NoPlanState } from '@/components/dashboard/no-plan-state';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { MealSlots } from '@/components/dashboard/meal-slots';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { RecommendCard } from '@/components/dashboard/recommend-card';

export function DashboardBody() {
  const { data, isLoading, isError, refetch } = useActiveBudgetPlan();
  const hasPlan = !!data?.plan;

  // A failed request is not an absent plan. This branch keyed on `!hasPlan`
  // alone, so an unreachable API greeted a user with a live plan — mid-period,
  // money already spent — with "Let's plan your first budget", the one screen
  // in the app that asserts they have never started. `orNull` maps a genuine
  // 404 to `data === null`, so the two cases are distinguishable; only the 404
  // is first-run.
  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1180px]">
        <DataError
          message="Couldn't load your plan. Your budget and meals are safe — this screen just can't reach them right now."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

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
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate">
              Today · Your plan
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-charcoal sm:text-4xl">
            What&apos;s for today?
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
