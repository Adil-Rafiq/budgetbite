import Link from 'next/link';
import { Inter, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google';

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
const PULSE = '#7f1c34';
const GLOW = '#ffa946';
const FOCUS = '#2d62ff';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';
const HAIR = 'rgba(26,26,26,0.08)';

const steps = [
  {
    n: '01',
    title: 'Set the week',
    body: 'Your budget in PKR, your radius, the restaurants you actually like. The default radius is 5 km.',
  },
  {
    n: '02',
    title: 'Ask for a plan',
    body: 'The AI proposes seven dinners from menus near you, ranked by fit-to-budget and your pins. Re-roll any single day.',
  },
  {
    n: '03',
    title: 'Order on Foodpanda',
    body: 'BudgetBite never places orders. Tap the day, open Foodpanda, pay. Checkout is two taps.',
  },
  {
    n: '04',
    title: 'Log what you paid',
    body: 'Enter the real amount in under five seconds. If the week drifts past threshold, the AI silently re-plans the rest.',
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
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11v9a1 1 0 0 0 1 1h6v-7h4v7h6a1 1 0 0 0 1-1v-9" />
                <path d="M1 11 12 3l11 8" />
              </svg>
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
            <a href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px]" style={{ color: VAST }}>
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium"
              style={{ background: VAST, color: LUMEN }}
            >
              Get started
              <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
            </Link>
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
            Early access · Karachi · free during beta
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
            BudgetBite plans your week of dinners from real Foodpanda menus near you,
            within your budget. You order on Foodpanda; we log what you paid and re-plan
            when the week drifts.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium transition hover:opacity-90"
              style={{ background: VAST, color: LUMEN }}
            >
              Create your plan
              <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>↵</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-[14px] font-medium"
              style={{ borderColor: VAST, color: VAST, background: 'transparent' }}
            >
              I have an account →
            </Link>
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
                    <button
                      className="rounded-full border px-4 py-2 text-[12px]"
                      style={{ borderColor: LUMEN_DK, color: VAST }}
                    >
                      Re-roll
                    </button>
                    <button
                      className="rounded-full px-4 py-2 text-[12px] font-medium"
                      style={{ background: FATHOM, color: LUMEN }}
                    >
                      Order on Foodpanda →
                    </button>
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
              The week stays{' '}
              <span style={{ color: MUTED }}>between you and your plan.</span>
            </h2>
          </div>
          <ul className="col-span-12 space-y-4 lg:col-span-7 lg:col-start-6">
            {[
              'Your spending log never leaves your device unless you sign in.',
              'Restaurant data is fetched from public Foodpanda listings, server-side. No tracking pixels.',
              'AI calls send the current week and your pins. They do not include your name, email, or order history.',
              'BudgetBite does not place orders. It does not see your Foodpanda account or card.',
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
            Plan this week{' '}
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
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium"
              style={{ background: VAST, color: LUMEN }}
            >
              Get started — free
              <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-[14px] font-medium"
              style={{ borderColor: VAST, color: VAST }}
            >
              Log in
            </Link>
          </div>
          <div
            className="mt-5 text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
          >
            Karachi only during beta · ETA Lahore Q3
          </div>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: LUMEN_DK, background: LUMEN }}>
        <div className="mx-auto grid max-w-[1180px] grid-cols-12 gap-8 px-8 py-14">
          <div className="col-span-12 md:col-span-4">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: FATHOM, color: LUMEN }}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11v9a1 1 0 0 0 1 1h6v-7h4v7h6a1 1 0 0 0 1-1v-9" />
                  <path d="M1 11 12 3l11 8" />
                </svg>
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
              A meal-planning app for people with a budget and a Foodpanda app. Built
              in Karachi.
            </p>
          </div>

          {[
            {
              h: 'Product',
              items: [
                ['How it works', '#how'],
                ['Privacy', '#privacy'],
                ['Get started', '/register'],
              ],
            },
            {
              h: 'Company',
              items: [
                ['About', '#'],
                ['Contact', 'mailto:hello@budgetbite.app'],
                ['Press kit', '#'],
              ],
            },
            {
              h: 'Legal',
              items: [
                ['Terms', '#'],
                ['Privacy policy', '#'],
                ['Cookies', '#'],
              ],
            },
          ].map((col) => (
            <div key={col.h} className="col-span-6 md:col-span-2">
              <div
                className="text-[10px] uppercase tracking-[0.22em]"
                style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
              >
                {col.h}
              </div>
              <ul className="mt-4 space-y-2 text-[13px]" style={{ color: VAST }}>
                {col.items.map(([label, href]) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
              v 1.0.4 · Karachi · made with{' '}
              <span style={{ color: PULSE }}>♥</span> and{' '}
              <span style={{ color: GLOW }}>karahi</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
