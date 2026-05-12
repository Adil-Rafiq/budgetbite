import Link from 'next/link';
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google';
import { Pill } from '@/components/ui/pill';
import { LogoIcon } from '@/components/icons';

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz'],
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const FOCUS = '#2d62ff';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';
const HAIR = 'rgba(26,26,26,0.08)';

const steps = [
  {
    n: '01',
    title: 'Start a plan',
    body: 'Pick a budget and timeframe, set your radius, and add the restaurants you actually like. The default radius is 5 km.',
  },
  {
    n: '02',
    title: 'Let the AI plan',
    body: 'It fills the plan with meals that fit the budget and lean on your pinned restaurants. Don\'t like one? Swap it.',
  },
  {
    n: '03',
    title: 'Order it yourself',
    body: 'BudgetBite never places orders. Tap the day and order through Foodpanda — or wherever the restaurant takes orders. Checkout is two taps.',
  },
  {
    n: '04',
    title: 'Log what you paid',
    body: 'Enter the real amount in under five seconds. If spending drifts past threshold, the AI silently re-plans the rest.',
  },
];

const week = [
  { d: 'Mon', meal: 'Aloo Paratha', pkr: 480, state: 'logged' },
  { d: 'Tue', meal: 'Chicken Karahi', pkr: 1200, state: 'logged' },
  { d: 'Wed', meal: 'Chapli Kebab', pkr: 720, state: 'logged' },
  { d: 'Thu', meal: 'Beef Nihari', pkr: 650, state: 'tonight' },
  { d: 'Fri', meal: 'Chicken Biryani', pkr: 420, state: 'plan' },
  { d: 'Sat', meal: 'Haleem', pkr: 380, state: 'plan' },
  { d: 'Sun', meal: 'BBQ Platter', pkr: 1850, state: 'plan' },
];

export default function LandingPage() {
  const spent = 8580;
  const total = 15000;
  const pct = Math.round((spent / total) * 100);

  return (
    <div
      className={`${body.variable} ${display.variable} ${mono.variable} min-h-screen antialiased`}
      style={{ fontFamily: 'var(--font-body)', background: LUMEN, color: VAST }}
    >
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ background: 'rgba(255,255,235,0.82)', borderColor: HAIR }}
      >
        <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: FATHOM, color: LUMEN }}
            >
              <LogoIcon />
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              BudgetBite
            </span>
          </Link>
          <div
            className="hidden items-center gap-8 md:flex"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: MUTED }}
          >
            <a href="#how">How it works</a>
            <a href="#privacy">Privacy</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px]" style={{ color: VAST }}>
              Log in
            </Link>
            <Pill asChild size="sm">
              <Link href="/register">
                Get started
                <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
              </Link>
            </Pill>
          </div>
        </nav>
      </header>

      <section className="relative mx-auto max-w-[1180px] px-8 pt-20 pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-8 -z-10 h-[440px] w-[820px] -translate-x-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(3,79,70,0.18), rgba(255,169,70,0.14) 55%, transparent 75%)',
            filter: 'blur(20px)',
          }}
        />

        <div className="mx-auto max-w-[820px] text-center">
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]"
            style={{
              fontFamily: 'var(--font-mono)',
              borderColor: LUMEN_DK,
              background: WHITE,
              color: MUTED,
            }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: FATHOM }} />
            Real menus · Real prices · Real budgets
          </div>

          <h1
            className="mt-7"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 6vw, 84px)',
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
            }}
          >
            Eat well, on a budget,
            <br />
            <span style={{ color: FATHOM }}>without the planning.</span>
          </h1>
          <p
            className="mx-auto mt-7 max-w-[58ch] text-[18px] leading-[1.55]"
            style={{ color: MUTED }}
          >
            BudgetBite plans your meals from real menus near you, within your budget.
            You handle the ordering; we log what you paid and re-plan when spending drifts.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Pill asChild size="lg">
              <Link href="/register">
                Create your plan
                <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>↵</span>
              </Link>
            </Pill>
            <Pill asChild variant="outline" size="lg">
              <Link href="/login">I have an account →</Link>
            </Pill>
          </div>

          <div
            className="mt-5 text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
          >
            No card · Sign in with Google or GitHub
          </div>
        </div>

        <div className="mt-20">
          <div
            className="overflow-hidden rounded-[14px]"
            style={{
              background: WHITE,
              boxShadow:
                '0 1px 0 rgba(0,0,0,0.04), 0 30px 80px -20px rgba(26,26,26,0.18), 0 8px 30px -10px rgba(26,26,26,0.08)',
              border: `1px solid ${LUMEN_DK}`,
            }}
          >
            <div
              className="flex items-center gap-2 border-b px-4 py-3"
              style={{ borderColor: LUMEN_DK, background: LUMEN }}
            >
              <span className="flex gap-1.5">
                <span className="block h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
                <span className="block h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
                <span className="block h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
              </span>
              <span
                className="ml-3 text-[11px]"
                style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
              >
                budgetbite.app — Plan · Week 19
              </span>
            </div>
            <div className="grid grid-cols-12">
              <aside
                className="col-span-12 border-r p-5 md:col-span-3"
                style={{ borderColor: LUMEN_DK, background: LUMEN }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                >
                  This week
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 26,
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ₨ 6,420
                  </span>
                </div>
                <div className="text-[12px]" style={{ color: MUTED }}>
                  left of ₨ 15,000
                </div>
                <div
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: LUMEN_DK }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${FATHOM}, ${FOCUS})`,
                    }}
                  />
                </div>
                <div
                  className="mt-2 flex items-center justify-between text-[11px]"
                  style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                >
                  <span>{pct}% spent</span>
                  <span>3 days left</span>
                </div>
              </aside>

              <div className="col-span-12 p-6 md:col-span-9 md:p-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div
                      className="text-[11px] uppercase tracking-[0.18em]"
                      style={{ fontFamily: 'var(--font-mono)', color: FATHOM }}
                    >
                      Tonight · Thursday
                    </div>
                    <h3
                      className="mt-1"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 30,
                        fontWeight: 600,
                        lineHeight: 1.15,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Beef Nihari{' '}
                      <span style={{ color: MUTED, fontWeight: 400 }}>+ naan</span>
                    </h3>
                    <div className="mt-1 text-[14px]" style={{ color: MUTED }}>
                      Sabri Nihari · Burns Road · 1.2 km
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill variant="ghost" size="xs">Re-roll</Pill>
                    <Pill variant="accent" size="xs">Order on Foodpanda →</Pill>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-2 md:grid-cols-7">
                  {week.map((day) => {
                    const isTonight = day.state === 'tonight';
                    const isLogged = day.state === 'logged';
                    return (
                      <div
                        key={day.d}
                        className="rounded-xl border p-3"
                        style={{
                          borderColor: isTonight ? FATHOM : LUMEN_DK,
                          background: isTonight ? 'rgba(3,79,70,0.06)' : WHITE,
                        }}
                      >
                        <div
                          className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em]"
                          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                        >
                          <span>{day.d}</span>
                          {isLogged && <span style={{ color: FATHOM }}>✓</span>}
                          {isTonight && <span style={{ color: FATHOM }}>●</span>}
                        </div>
                        <div
                          className="mt-3 text-[13px] leading-[1.25]"
                          style={{ fontWeight: 500, color: isLogged ? MUTED : VAST }}
                        >
                          {day.meal}
                        </div>
                        <div
                          className="mt-4 text-[14px] tabular-nums"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            color: isLogged ? MUTED : VAST,
                          }}
                        >
                          ₨ {day.pkr.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how"
        className="border-t"
        style={{ borderColor: LUMEN_DK, background: WHITE }}
      >
        <div className="mx-auto max-w-[1180px] px-8 py-24">
          <div className="grid grid-cols-12 items-end gap-8">
            <div className="col-span-12 lg:col-span-5">
              <div
                className="text-[11px] uppercase tracking-[0.22em]"
                style={{ fontFamily: 'var(--font-mono)', color: FATHOM }}
              >
                How it works
              </div>
              <h2
                className="mt-4"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(30px, 4vw, 48px)',
                  fontWeight: 600,
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                }}
              >
                Four steps. <span style={{ color: MUTED }}>No more.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-7 lg:col-start-6">
              <p className="text-[17px] leading-[1.55]" style={{ color: MUTED }}>
                BudgetBite is intentionally small. One screen, one button, one budget.
                The AI is a helper, not a chat partner — it works inline and gets out
                of the way.
              </p>
            </div>
          </div>

          <ol className="mt-16 grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2">
            {steps.map((s) => (
              <li key={s.n} className="grid grid-cols-[auto_1fr] gap-6">
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 36,
                    lineHeight: 1,
                    color: FATHOM,
                    fontWeight: 500,
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: MUTED }}>
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="privacy" className="border-t" style={{ borderColor: LUMEN_DK }}>
        <div className="mx-auto grid max-w-[1180px] grid-cols-12 gap-8 px-8 py-24">
          <div className="col-span-12 lg:col-span-5">
            <div
              className="text-[11px] uppercase tracking-[0.22em]"
              style={{ fontFamily: 'var(--font-mono)', color: FATHOM }}
            >
              Privacy
            </div>
            <h2
              className="mt-4"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(30px, 4vw, 48px)',
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
              }}
            >
              Your meals stay{' '}
              <span style={{ color: MUTED }}>between you and your plan.</span>
            </h2>
          </div>
          <ul className="col-span-12 space-y-4 lg:col-span-7 lg:col-start-6">
            {[
              'Your spending log never leaves your device unless you sign in.',
              'Restaurant data is fetched from public listings, server-side.',
              'AI calls send the current plan and your pins. They do not include your name, email, or order history.',
              'BudgetBite does not place orders. It never sees your ordering accounts or payment details.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 text-[15px]" style={{ color: VAST }}>
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: FATHOM, color: LUMEN, fontSize: 11, lineHeight: 1 }}
                >
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t" style={{ borderColor: LUMEN_DK, background: WHITE }}>
        <div className="mx-auto max-w-[1180px] px-8 py-28 text-center">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
            }}
          >
            Plan your meals{' '}
            <span style={{ color: FATHOM }}>in two minutes.</span>
          </h2>
          <p
            className="mx-auto mt-6 max-w-[54ch] text-[17px] leading-[1.6]"
            style={{ color: MUTED }}
          >
            Set a budget, pin a few restaurants you trust, and let the planner do the
            rest. You can change engines and re-roll any day at any time.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Pill asChild size="lg">
              <Link href="/register">
                Get started — free
                <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
              </Link>
            </Pill>
            <Pill asChild variant="outline" size="lg">
              <Link href="/login">Log in</Link>
            </Pill>
          </div>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: LUMEN_DK, background: LUMEN }}>
        <div className="mx-auto flex max-w-[1180px] flex-col gap-10 px-8 py-14 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="md:max-w-[420px]">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: FATHOM, color: LUMEN }}
              >
                <LogoIcon size={12} />
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                BudgetBite
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-[1.6]" style={{ color: MUTED }}>
              A meal-planning app for people who eat out and want to stay on budget.
            </p>
          </div>

          <div>
            <div
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
            >
              Product
            </div>
            <ul className="mt-4 space-y-2 text-[13px]" style={{ color: VAST }}>
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#privacy">Privacy</a>
              </li>
              <li>
                <a href="/register">Get started</a>
              </li>
              <li>
                <a
                  href="https://github.com/Adil-Rafiq/budgetbite"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="border-t"
          style={{ borderColor: LUMEN_DK, fontFamily: 'var(--font-mono)' }}
        >
          <div
            className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-8 py-5 text-[11px]"
            style={{ color: MUTED }}
          >
            <span>© 2026 BudgetBite</span>
            <span>
              Built by{' '}
              <a
                href="https://github.com/Adil-Rafiq"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: VAST, textUnderlineOffset: 2 }}
              >
                Adil Rafiq
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
