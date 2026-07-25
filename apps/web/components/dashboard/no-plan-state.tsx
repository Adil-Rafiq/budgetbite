'use client';

import Link from 'next/link';
import { ArrowRight, Wallet, Sparkles, PiggyBank } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Set your budget',
    body: 'Tell us your weekly or monthly food budget.',
  },
  {
    icon: Sparkles,
    title: 'We plan the meals',
    body: 'Three nearby options for every meal, always in budget.',
  },
  {
    icon: PiggyBank,
    title: 'You log what you spend',
    body: 'Order yourself, log the cost, and we re-plan the rest.',
  },
];

/**
 * First-run dashboard. When there's no active plan there is exactly one thing
 * to do — set a budget — so the whole screen says that once, clearly, instead
 * of repeating "no plan yet" across four separate widgets.
 */
export function NoPlanState() {
  return (
    <section className="overflow-hidden rounded-3xl border border-sage bg-white shadow-sm">
      <div className="flex flex-col gap-6 p-7 sm:p-10">
        <div className="flex max-w-[560px] flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-dark-green">
            Get started
          </span>
          <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-charcoal sm:text-4xl">
            Let&apos;s plan your first budget.
          </h1>
          <p className="text-[15px] leading-relaxed text-slate">
            Set what you want to spend on food this week or month, and BudgetBite suggests meals
            from restaurants near you — three options each, always within budget. Takes about two
            minutes.
          </p>
          <Link
            href="/plans"
            className="mt-1 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-green px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-dark-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Create your plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ol className="grid gap-x-6 gap-y-5 border-t border-sage/70 pt-6 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green/10 text-green">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-charcoal">
                    <span className="text-slate tabular-nums">{i + 1}.</span>
                    {step.title}
                  </span>
                  <span className="text-[13px] leading-snug text-slate">{step.body}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
