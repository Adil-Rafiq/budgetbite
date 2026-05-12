'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { CountUp, Stagger, StaggerItem } from '@/components/motion';
import { Pill } from '@/components/ui/pill';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const AMBER = '#b8741a';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

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
    <div
      className="rounded-2xl p-5"
      style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
    >
      <div
        className="h-3 w-16 rounded animate-pulse"
        style={{ background: LUMEN }}
      />
      <div
        className="mt-4 h-7 w-28 rounded animate-pulse"
        style={{ background: LUMEN }}
      />
      <div
        className="mt-2 h-3 w-20 rounded animate-pulse"
        style={{ background: LUMEN }}
      />
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
    <div
      className="flex items-center gap-3 rounded-xl p-4 text-[13px]"
      style={{ background: 'rgba(127,28,52,0.06)', border: `1px solid ${PULSE}`, color: PULSE }}
    >
      <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
      {message}
    </div>
  );
}

function NoPlanMessage() {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between"
      style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
    >
      <div className="flex flex-col gap-1">
        <div
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
        >
          no active plan
        </div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: VAST,
          }}
        >
          Set this week&apos;s budget to get started.
        </p>
        <p className="text-[13px]" style={{ color: MUTED }}>
          Two minutes. We&apos;ll plan the meals.
        </p>
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
  accent: string;
  glyph: string;
}

function StatCard({ code, label, value, sub, accent, glyph }: CardProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-5"
      whileHover={{ y: -2, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        background: WHITE,
        border: `1px solid ${LUMEN_DK}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
        >
          {code} · {label}
        </span>
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px]"
          style={{ background: `${accent}14`, color: accent, fontFamily: 'var(--font-mono)' }}
          aria-hidden
        >
          {glyph}
        </span>
      </div>
      <div
        className="mt-4 truncate"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: VAST,
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      <div
        className="mt-1 truncate text-[12px]"
        style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
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
  const spentAccent = health === 'good' ? FATHOM : health === 'warning' ? AMBER : PULSE;

  const cards: CardProps[] = [
    {
      code: '01',
      label: 'total budget',
      value: <CountUp value={ctx.totalBudget} prefix="₨ " />,
      sub: `${activePlan.planType} plan`,
      accent: FATHOM,
      glyph: '◉',
    },
    {
      code: '02',
      label: 'spent',
      value: <CountUp value={ctx.amountSpent} prefix="₨ " />,
      sub: `${ctx.mealsConsumed} of ${ctx.totalMeals} meals`,
      accent: spentAccent,
      glyph: '↓',
    },
    {
      code: '03',
      label: 'remaining',
      value: <CountUp value={ctx.amountRemaining} prefix="₨ " />,
      sub: `₨ ${Math.round(ctx.avgBudgetPerRemainingMeal).toLocaleString()} / meal`,
      accent: FATHOM,
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
      accent: AMBER,
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
