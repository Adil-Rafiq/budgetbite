'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { LogoIcon } from '@/components/icons';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

function initials(name: string | undefined): string {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.charAt(0).toUpperCase() ?? '';
  const b = parts[1]?.charAt(0).toUpperCase() ?? '';
  return `${a}${b}` || '•';
}

export function AppHeader() {
  const { data: active } = useActiveBudgetPlan();
  const { data: user } = useUser();

  const totalBudget = active?.plan.totalBudget ?? 0;
  const spent = active?.plan.spentAmount ?? 0;
  const remaining = Math.max(0, totalBudget - spent);
  const spentPercent = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(255,255,235,0.85)',
        backdropFilter: 'saturate(180%) blur(10px)',
        borderBottom: `1px solid ${LUMEN_DK}`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: FATHOM, color: LUMEN }}
          >
            <LogoIcon size={13} />
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
        </Link>

        <div
          className="hidden lg:block text-[11px] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.22em' }}
        >
          home · /dashboard
        </div>

        <div className="flex items-center gap-3">
          {active && (
            <div
              className="hidden items-center gap-3 rounded-full px-4 py-1.5 sm:flex"
              style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
            >
              <span
                className="text-[10px] uppercase"
                style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
              >
                left
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: VAST,
                }}
              >
                ₨ {remaining.toLocaleString()}
              </span>
              <div
                className="h-1.5 w-20 overflow-hidden rounded-full"
                style={{ background: LUMEN }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(100, spentPercent)}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  style={{
                    background: spentPercent >= 90 ? '#7f1c34' : FATHOM,
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: MUTED,
                }}
              >
                {spentPercent}%
              </span>
            </div>
          )}
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px]"
            style={{
              background: FATHOM,
              color: LUMEN,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
            title={user?.name ?? ''}
          >
            {initials(user?.name)}
          </span>
        </div>
      </div>
    </header>
  );
}
