import { SummaryCards } from '@/components/dashboard/summary-cards';
import { MealSlots } from '@/components/dashboard/meal-slots';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { RecommendCard } from '@/components/dashboard/recommend-card';
import { FadeUp } from '@/components/motion';

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <header className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate/70">
              Today · Your plan
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-charcoal sm:text-4xl">
            Welcome back.
          </h1>
          <p className="max-w-[540px] text-[15px] leading-relaxed text-slate">
            Your budget, your meals, your plan — at a glance. No spreadsheets, no math.
          </p>
        </header>
      </FadeUp>

      <FadeUp delay={0.08}>
        <SummaryCards />
      </FadeUp>
      <FadeUp delay={0.16}>
        <MealSlots />
      </FadeUp>
      <FadeUp delay={0.24}>
        <RecentActivity />
      </FadeUp>
      <FadeUp delay={0.32}>
        <RecommendCard />
      </FadeUp>
    </div>
  );
}
