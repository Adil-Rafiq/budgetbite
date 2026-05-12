import { SummaryCards } from '@/components/dashboard/summary-cards';
import { MealSlots } from '@/components/dashboard/meal-slots';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { FadeUp } from '@/components/motion';

const VAST = '#1a1a1a';
const MUTED = '#71716a';
const FATHOM = '#034f46';
const SOFT = '#a6a691';

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <header className="flex flex-col gap-2">
          <div
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
          >
            today · /dashboard
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: VAST,
            }}
          >
            Welcome back.
          </h1>
          <p className="text-[14px]" style={{ color: MUTED, maxWidth: 540 }}>
            Your budget, your meals, your week — at a glance.
            <span style={{ fontFamily: 'var(--font-mono)', color: SOFT, marginLeft: 6, fontSize: 12 }}>
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
    </div>
  );
}
