'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { CountUp, Stagger, StaggerItem } from '@/components/motion';
import { Pill } from '@/components/ui/pill';

type Tone = 'fathom' | 'amber' | 'pulse';

const getDaysLeft = (endDateStr: string): number => {
  const today = new Date();
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = endDateStr.split('-').map(Number);
  const endLocal = new Date(year!, month! - 1, day!);
  return Math.max(
    0,
    Math.ceil((endLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

const getSpendingHealth = (spent: number, total: number): 'good' | 'warning' | 'danger' => {
  const ratio = spent / total;
  if (ratio < 0.7) return 'good';
  if (ratio < 0.9) return 'warning';
  return 'danger';
};

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-lumen-dk bg-white p-5">
      <div className="h-3 w-16 animate-pulse rounded bg-lumen" />
      <div className="mt-4 h-7 w-28 animate-pulse rounded bg-lumen" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-lumen" />
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SummaryCardsError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-pulse bg-pulse/[0.06] p-4 text-[13px] text-pulse">
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      {message}
    </div>
  );
}

function NoPlanMessage() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-lumen-dk bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div
          className="text-[10px] uppercase text-fathom"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
        >
          no active plan
        </div>
        <p
          className="text-vast"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          Set a budget to get started.
        </p>
        <p className="text-[13px] text-ink">Two minutes. We&apos;ll plan the meals.</p>
      </div>
      <Pill asChild size="md" className="self-start sm:self-auto">
        <Link href="/plans">
          Create plan
          <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
        </Link>
      </Pill>
    </div>
  );
}

interface CardProps {
  code: string;
  label: string;
  value: ReactNode;
  sub: string;
  tone: Tone;
  glyph: string;
}

const TONE_CLASS: Record<Tone, string> = {
  fathom: 'bg-fathom/[0.08] text-fathom',
  amber: 'bg-amber/[0.08] text-amber',
  pulse: 'bg-pulse/[0.08] text-pulse',
};

function StatCard({ code, label, value, sub, tone, glyph }: CardProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-lumen-dk bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
      whileHover={{ y: -2, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-[10px] uppercase text-soft"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
        >
          {code} · {label}
        </span>
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${TONE_CLASS[tone]}`}
          style={{ fontFamily: 'var(--font-mono)' }}
          aria-hidden
        >
          {glyph}
        </span>
      </div>
      <div
        className="mt-4 truncate text-vast"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      <div
        className="mt-1 truncate text-[12px] text-ink"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {sub}
      </div>
    </motion.div>
  );
}

export function SummaryCards() {
  const { data: planData, isLoading: isPlanLoading, error: planError } = useActiveBudgetPlan();
  const { plan: activePlan, budgetState: ctx } = planData ?? {};

  if (isPlanLoading) return <SummaryCardsSkeleton />;
  if (planError)
    return <SummaryCardsError message={`Failed to load budget plan: ${planError.message}`} />;
  if (!activePlan) return <NoPlanMessage />;
  if (!ctx) return <SummaryCardsSkeleton />;

  const daysLeft = getDaysLeft(activePlan.endDate);
  const health = getSpendingHealth(ctx.amountSpent, ctx.totalBudget);
  const spentTone: Tone = health === 'good' ? 'fathom' : health === 'warning' ? 'amber' : 'pulse';

  const cards: CardProps[] = [
    {
      code: '01',
      label: 'total budget',
      value: <CountUp value={ctx.totalBudget} prefix="₨ " />,
      sub: `${activePlan.planType} plan`,
      tone: 'fathom',
      glyph: '◉',
    },
    {
      code: '02',
      label: 'spent',
      value: <CountUp value={ctx.amountSpent} prefix="₨ " />,
      sub: `${ctx.mealsConsumed} of ${ctx.totalMeals} meals`,
      tone: spentTone,
      glyph: '↓',
    },
    {
      code: '03',
      label: 'remaining',
      value: <CountUp value={ctx.amountRemaining} prefix="₨ " />,
      sub: `₨ ${Math.round(ctx.avgBudgetPerRemainingMeal).toLocaleString()} / meal`,
      tone: 'fathom',
      glyph: '⊙',
    },
    {
      code: '04',
      label: 'days left',
      value: (
        <>
          <CountUp value={daysLeft} /> {daysLeft === 1 ? 'day' : 'days'}
        </>
      ),
      sub: `ends ${activePlan.endDate}`,
      tone: 'amber',
      glyph: '⌖',
    },
  ];

  return (
    <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((card) => (
        <StaggerItem key={card.code}>
          <StatCard {...card} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
