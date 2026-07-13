import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUpRight,
  Bell,
  Check,
  Leaf,
  Mail,
  MapPin,
  PencilLine,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { LogoIcon, GoogleIcon, GitHubIcon } from '@/components/icons';

const features = [
  {
    icon: MapPin,
    tint: 'green' as const,
    title: 'Hyper-local discovery',
    body: 'Real restaurants within your radius, pulled from real menus with real prices — not generic recipes.',
  },
  {
    icon: RefreshCw,
    tint: 'tomato' as const,
    title: 'Auto re-planning',
    body: 'Trending over budget by Thursday? The AI adjusts the rest of the week before it becomes a problem.',
  },
  {
    icon: ShoppingBag,
    tint: 'sage' as const,
    title: 'You stay in control',
    body: 'BudgetBite never places orders or touches your payment details. You order on Foodpanda; we just track it.',
  },
  {
    icon: Bell,
    tint: 'green' as const,
    title: 'A weekly digest',
    body: 'A gentle Sunday email with where the week landed and what next week looks like. No mealtime nagging.',
  },
];

export default function LandingPage() {
  const total = 15000;
  const spent = 8580;
  const remaining = total - spent;
  const pct = Math.round((spent / total) * 100);

  return (
    <div className="min-h-screen bg-canvas text-charcoal antialiased">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-sage/60 bg-canvas/85 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-white">
              <LogoIcon size={16} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              Budget<span className="text-green">Bite</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-normal text-charcoal/70 md:flex">
            <a href="#how" className="transition-colors hover:text-green">
              How it works
            </a>
            <a href="#features" className="transition-colors hover:text-green">
              Features
            </a>
            <a href="#privacy" className="transition-colors hover:text-green">
              Privacy
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-normal text-charcoal/70 transition-colors hover:text-charcoal md:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-dark-green"
            >
              <Leaf className="h-3.5 w-3.5" />
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section id="hero" className="relative overflow-hidden pt-24 pb-20 lg:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #d4e8b0 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sage bg-white px-4 py-1.5 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
              <span className="text-xs font-normal uppercase tracking-widest text-charcoal/70">
                AI-powered meal planning
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="mx-auto mb-6 max-w-4xl text-center">
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Eat well from{' '}
              <span className="relative inline-block text-green">
                local restaurants
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 300 8"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2 5.5C60 2.5 140 1 300 5.5"
                    stroke="#e84c3d"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              without breaking the bank.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-charcoal/60 sm:text-xl">
              BudgetBite plans your meals from real menus near you, within your budget. You handle
              the ordering — we track what you paid and re-plan when spending drifts.
            </p>
          </div>

          {/* HERO VISUAL — food photo with floating plan cards */}
          <div className="relative mx-auto mt-12 max-w-4xl">
            <div className="relative h-[340px] overflow-hidden rounded-3xl shadow-2xl sm:h-[420px] lg:h-[470px]">
              <Image
                src="/hero-food.png"
                alt="An overhead spread of dishes from local restaurants"
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-charcoal/20 to-charcoal/55"
              />

              {/* top-left: AI re-planned */}
              <div className="absolute left-4 top-4 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-green/15">
                    <RefreshCw className="h-4 w-4 text-green" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-normal text-charcoal">AI re-planned</p>
                    <p className="text-xs text-charcoal/50">Back on track for the week</p>
                  </div>
                </div>
              </div>

              {/* top-right: under budget */}
              <div className="absolute right-4 top-4 rounded-2xl bg-tomato px-3 py-2.5 text-white shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <p className="font-display text-sm font-normal">Under budget</p>
                </div>
                <p className="mt-0.5 text-xs text-white/80">
                  ₨ {remaining.toLocaleString()} still to spend
                </p>
              </div>

              {/* bottom: budget bar + AI suggestion */}
              <div className="bb-float absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-normal uppercase tracking-wide text-charcoal/50">
                      Weekly budget
                    </p>
                    <p className="font-display text-lg font-normal text-charcoal">
                      ₨ {total.toLocaleString()}{' '}
                      <span className="text-sm font-normal text-charcoal/40">/ week</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-normal uppercase tracking-wide text-charcoal/50">
                      Remaining
                    </p>
                    <p className="font-display text-lg font-normal text-green">
                      ₨ {remaining.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-sage/60">
                  <div className="h-full" style={{ width: `${pct}%` }}>
                    <div className="bb-progress h-full rounded-full bg-gradient-to-r from-green to-green/70" />
                  </div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-charcoal/40">
                  <span>₨ 0</span>
                  <span>{pct}% used · 3 days left</span>
                  <span>₨ {total.toLocaleString()}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-green" />
                  <p className="text-xs font-normal text-charcoal">
                    AI suggests <span className="text-tomato">Sabri Nihari</span> — ₨650 nearby ·
                    fits your budget
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AUTH CARD */}
          <div className="relative z-20 mx-auto mt-12 max-w-md">
            <div className="rounded-3xl border border-sage bg-white p-6 shadow-2xl sm:p-7">
              <div className="mb-5 text-center">
                <h3 className="font-display text-xl font-normal">Start planning in 60 seconds</h3>
                <p className="mt-1 text-sm text-charcoal/50">
                  Free · No card · Sign in with Google or GitHub
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/register"
                  className="flex min-h-12 items-center justify-center gap-3 rounded-xl border border-sage bg-white text-sm font-normal shadow-sm transition-all hover:border-green/40 hover:bg-canvas"
                >
                  <GoogleIcon size={18} />
                  Continue with Google
                </Link>
                <Link
                  href="/register"
                  className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-charcoal text-sm font-normal text-white transition-all hover:bg-charcoal/90"
                >
                  <GitHubIcon size={18} />
                  Continue with GitHub
                </Link>
              </div>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-sage" />
                <span className="text-xs font-normal text-charcoal/40">or</span>
                <span className="h-px flex-1 bg-sage" />
              </div>

              <Link
                href="/register"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white shadow-md transition-all hover:bg-dark-green"
              >
                <Mail className="h-4 w-4" />
                Sign up with email
              </Link>

              <p className="mt-3 text-center text-xs text-charcoal/30">
                By continuing you agree to our Terms & Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-sage bg-canvas py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sage/50 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-green" />
              <span className="text-xs font-normal uppercase tracking-widest text-green">
                How it works
              </span>
            </div>
            <h2 className="font-display text-4xl font-normal leading-tight tracking-tight lg:text-5xl">
              Four steps. Zero stress.
              <br />
              Every single week.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal/55">
              BudgetBite doesn&apos;t just plan once — it adapts every time you log a meal.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {/* connector line linking the badges (desktop) */}
            <div
              aria-hidden
              className="absolute inset-x-[12.5%] top-[44px] z-0 hidden h-0.5 rounded-full bg-gradient-to-r from-sage via-green/40 to-sage opacity-60 lg:block"
            />

            {/* STEP 1 — Set your budget (active) */}
            <div className="relative z-10 rounded-3xl border-2 border-green bg-gradient-to-br from-canvas to-sage p-6 transition-transform hover:-translate-y-1">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green text-sm font-normal text-white shadow-md">
                  01
                </span>
                <SlidersHorizontal className="ml-auto h-5 w-5 text-green" />
              </div>
              <h3 className="mb-2 font-display text-lg font-normal">Set your budget</h3>
              <p className="mb-5 text-sm leading-relaxed text-charcoal/60">
                Pick a weekly or monthly food budget and a search radius. One number is all we need
                to start.
              </p>
              <div className="rounded-2xl border border-sage/60 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-normal text-charcoal/50">Weekly budget</span>
                  <span className="font-display text-lg font-normal text-green">₨ 15,000</span>
                </div>
                <div className="relative h-2 rounded-full bg-sage/60">
                  <div className="absolute inset-y-0 left-0 w-[58%] rounded-full bg-gradient-to-r from-green to-green/70" />
                  <div className="absolute left-[58%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-green bg-white shadow" />
                </div>
                <div className="mt-1 flex justify-between text-xs text-charcoal/30">
                  <span>₨ 5k</span>
                  <span>₨ 40k</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="flex-1 rounded-xl bg-sage/60 py-1.5 text-center text-xs font-normal text-charcoal/70">
                    Weekly
                  </span>
                  <span className="flex-1 rounded-xl border border-sage/50 bg-canvas py-1.5 text-center text-xs font-normal text-charcoal/40">
                    Monthly
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 2 — AI meal curation */}
            <div className="relative z-10 rounded-3xl border-2 border-sage/40 bg-white p-6 transition-all hover:-translate-y-1 hover:border-green/30">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-charcoal text-sm font-normal text-white shadow-md">
                  02
                </span>
                <Sparkles className="ml-auto h-5 w-5 text-charcoal/30" />
              </div>
              <h3 className="mb-2 font-display text-lg font-normal">AI meal curation</h3>
              <p className="mb-5 text-sm leading-relaxed text-charcoal/60">
                Meals from real menus at nearby restaurants that fit what you have left — leaning on
                the spots you like.
              </p>
              <div className="space-y-2">
                {[
                  { name: 'Sabri Nihari', meta: '1.2 km · Nihari', price: '₨ 650', tint: 'tomato' },
                  {
                    name: 'Student Biryani',
                    meta: '0.8 km · Biryani',
                    price: '₨ 420',
                    tint: 'green',
                  },
                  {
                    name: 'Chai & Paratha',
                    meta: '0.4 km · Breakfast',
                    price: '₨ 180',
                    tint: 'sage',
                  },
                ].map((m, i) => {
                  const tint =
                    m.tint === 'tomato'
                      ? 'bg-tomato/10 text-tomato'
                      : m.tint === 'green'
                        ? 'bg-green/15 text-green'
                        : 'bg-sage/50 text-dark-green';
                  return (
                    <div
                      key={m.name}
                      className={`flex items-center gap-3 rounded-2xl border border-sage/30 bg-canvas px-3 py-2.5 ${
                        i === 2 ? 'opacity-60' : ''
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tint}`}
                      >
                        <Utensils className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-normal text-charcoal">{m.name}</p>
                        <p className="text-xs text-charcoal/40">{m.meta}</p>
                      </div>
                      <span className="shrink-0 font-display text-sm font-normal text-green">
                        {m.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 3 — Log what you paid */}
            <div className="relative z-10 rounded-3xl border-2 border-sage/40 bg-white p-6 transition-all hover:-translate-y-1 hover:border-green/30">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-charcoal text-sm font-normal text-white shadow-md">
                  03
                </span>
                <PencilLine className="ml-auto h-5 w-5 text-charcoal/30" />
              </div>
              <h3 className="mb-2 font-display text-lg font-normal">Log what you paid</h3>
              <p className="mb-5 text-sm leading-relaxed text-charcoal/60">
                You order on Foodpanda, then enter the real amount in seconds. No receipts to scan,
                no spreadsheets.
              </p>
              <div className="rounded-2xl border border-sage/40 bg-canvas p-4">
                <div className="mb-3 rounded-xl border border-sage/30 bg-white p-3 text-center">
                  <p className="text-xs text-charcoal/40">You paid</p>
                  <p className="font-display text-2xl font-normal text-charcoal">₨ 650</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-sage/30 bg-white px-3 py-2.5">
                  <PencilLine className="h-3.5 w-3.5 shrink-0 text-charcoal/30" />
                  <span className="flex-1 truncate text-xs text-charcoal">Sabri Nihari</span>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-green" />
                  <span className="text-xs font-normal text-green">Logged · Budget updated</span>
                </div>
              </div>
            </div>

            {/* STEP 4 — It re-plans for you */}
            <div className="relative z-10 rounded-3xl border-2 border-sage/40 bg-white p-6 transition-all hover:-translate-y-1 hover:border-green/30">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tomato text-sm font-normal text-white shadow-md">
                  04
                </span>
                <RefreshCw className="ml-auto h-5 w-5 text-tomato/40" />
              </div>
              <h3 className="mb-2 font-display text-lg font-normal">It re-plans for you</h3>
              <p className="mb-5 text-sm leading-relaxed text-charcoal/60">
                If your spending drifts past threshold, the AI quietly re-plans the rest of the week
                so you finish on budget.
              </p>
              <div className="space-y-2 rounded-2xl border border-sage/40 bg-canvas p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-normal uppercase tracking-wide text-charcoal/60">
                    New plan — rest of week
                  </span>
                  <span className="font-display text-sm font-normal text-tomato">₨ 6,420 left</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { day: 'Thu', name: 'Karachi Broast', price: '₨ 520' },
                    { day: 'Fri', name: 'Biryani Center', price: '₨ 380' },
                    { day: 'Sat', name: 'BBQ Tonight', price: '₨ 600' },
                  ].map((row) => (
                    <div
                      key={row.day}
                      className="flex items-center gap-2 rounded-xl border border-sage/20 bg-white px-3 py-2"
                    >
                      <span className="w-8 shrink-0 text-xs text-charcoal/40">{row.day}</span>
                      <span className="truncate text-xs font-normal text-charcoal">{row.name}</span>
                      <span className="ml-auto shrink-0 font-display text-xs font-normal text-green">
                        {row.price}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <Sparkles className="h-3.5 w-3.5 text-tomato" />
                  <span className="text-xs font-normal text-tomato">AI re-planned instantly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — dark section */}
      <section id="features" className="bg-charcoal py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green/20 px-4 py-1.5">
                <Utensils className="h-3.5 w-3.5 text-green" />
                <span className="text-xs font-normal uppercase tracking-widest text-green">
                  What you get
                </span>
              </div>
              <h2 className="mb-6 font-display text-4xl font-normal leading-tight tracking-tight text-white lg:text-5xl">
                Built for people who love food <span className="text-green">and</span> their budget.
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-white/50">
                No spreadsheets, no guilt. Just a planner that knows what&apos;s near you, what fits
                your budget, and adapts when real life happens.
              </p>

              <div className="space-y-5">
                {features.map((f) => {
                  const Icon = f.icon;
                  const tint =
                    f.tint === 'green'
                      ? 'bg-green/15 text-green'
                      : f.tint === 'tomato'
                        ? 'bg-tomato/15 text-tomato'
                        : 'bg-sage/20 text-sage';
                  return (
                    <div key={f.title} className="flex items-start gap-4">
                      <span
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tint}`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <h4 className="mb-1 font-display text-base font-normal text-white">
                          {f.title}
                        </h4>
                        <p className="text-sm leading-relaxed text-white/45">{f.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* right: stat panel */}
            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-normal uppercase tracking-widest text-white/40">
                    Your month at a glance
                  </p>
                  <span className="rounded-lg bg-green/15 px-2.5 py-1 text-xs font-normal text-green">
                    On track
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="font-display text-3xl font-normal text-white">₨ 6,420</p>
                    <p className="mt-1 text-xs text-white/40">left this week</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="font-display text-3xl font-normal text-green">18</p>
                    <p className="mt-1 text-xs text-white/40">meals planned</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Sabri Nihari · Burns Road', amt: '₨ 650' },
                    { label: 'Student Biryani · Nazimabad', amt: '₨ 420' },
                    { label: 'Chai & Paratha · nearby', amt: '₨ 180' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                    >
                      <span className="text-sm text-white/70">{row.label}</span>
                      <span className="font-display text-sm font-normal text-white">{row.amt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* floating card */}
              <div className="absolute -bottom-5 -left-4 hidden rounded-2xl bg-green px-4 py-3 shadow-2xl lg:block">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-white" />
                  <span className="font-display text-sm font-normal text-white">
                    Re-planned this week
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/80">Still under budget</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section id="privacy" className="border-t border-sage bg-white py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sage/60 px-4 py-1.5">
              <span className="text-xs font-normal uppercase tracking-widest text-dark-green">
                Privacy
              </span>
            </div>
            <h2 className="font-display text-4xl font-normal leading-tight tracking-tight lg:text-5xl">
              Your meals stay <span className="text-charcoal/50">between you and your plan.</span>
            </h2>
          </div>
          <ul className="space-y-4 lg:col-span-6 lg:col-start-7">
            {[
              'Restaurant data is fetched from public listings, server-side.',
              'AI calls send only your current plan and pinned restaurants — not your name, email, or order history.',
              'BudgetBite never places orders. It never sees your Foodpanda account or payment details.',
              'Export or delete your data at any time.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 text-base text-charcoal">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green text-white">
                  <Check className="h-3 w-3" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-green py-24 lg:py-32">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10"
        />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-4xl font-normal leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Plan your next meal in
            <br className="hidden sm:block" /> two minutes.
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-white/80">
            Set a budget, pin a few restaurants you trust, and let the planner do the rest. Re-roll
            any day, any time.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-dark-green shadow-xl transition-all hover:bg-canvas"
            >
              <Leaf className="h-4 w-4" />
              Get started — free
            </Link>
            <Link
              href="#how"
              className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl border-2 border-white/50 px-8 py-4 text-base font-normal text-white transition-all hover:border-white hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> No card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> You order where you like
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Set up in 60 seconds
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-charcoal pt-16 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 border-b border-white/10 pb-12 md:flex-row md:items-start md:justify-between">
            <div className="md:max-w-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-white">
                  <LogoIcon size={16} />
                </span>
                <span className="font-display text-xl font-bold text-white">
                  Budget<span className="text-green">Bite</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/40">
                The AI meal planner that keeps your food budget healthy — and your taste buds
                happier.
              </p>
            </div>

            <div className="flex gap-16">
              <div>
                <p className="mb-4 font-display text-sm font-normal uppercase tracking-wide text-white">
                  Product
                </p>
                <ul className="space-y-3 text-sm text-white/45">
                  <li>
                    <a href="#how" className="transition-colors hover:text-green">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="transition-colors hover:text-green">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#privacy" className="transition-colors hover:text-green">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <Link href="/register" className="transition-colors hover:text-green">
                      Get started
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-4 font-display text-sm font-normal uppercase tracking-wide text-white">
                  More
                </p>
                <ul className="space-y-3 text-sm text-white/45">
                  <li>
                    <Link href="/login" className="transition-colors hover:text-green">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://github.com/Adil-Rafiq/budgetbite"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 transition-colors hover:text-green"
                    >
                      Source <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 pt-8 sm:flex-row">
            <p className="text-sm text-white/30">© 2026 BudgetBite</p>
            <p className="text-sm text-white/30">
              Built by{' '}
              <a
                href="https://github.com/Adil-Rafiq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 transition-colors hover:text-green"
              >
                Adil Rafiq
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
