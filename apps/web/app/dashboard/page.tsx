import { SummaryCards } from '@/components/dashboard/summary-cards';
import { MealSlots } from '@/components/dashboard/meal-slots';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { RecommendCard } from '@/components/dashboard/recommend-card';
import { FadeUp } from '@/components/motion';

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <header className="flex flex-col gap-2">
          <div
            className="text-[10px] uppercase text-fathom"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
          >
            today · /dashboard
          </div>
          <h1
            className="text-vast"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            Welcome back.
          </h1>
          <p className="max-w-[540px] text-[14px] text-ink">
            Your budget, your meals, your plan — at a glance.
            <span
              className="ml-1.5 text-[12px] text-soft"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              no spreadsheets, no math.
            </span>
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
