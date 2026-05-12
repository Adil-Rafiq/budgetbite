'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/plans', label: 'Plans' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/profile', label: 'Profile' },
];

function initials(name: string | undefined): string {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.charAt(0).toUpperCase() ?? '';
  const b = parts[1]?.charAt(0).toUpperCase() ?? '';
  return `${a}${b}` || '•';
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: active } = useActiveBudgetPlan();
  const { data: user } = useUser();

  const totalBudget = active?.plan.totalBudget ?? 0;
  const spent = active?.plan.spentAmount ?? 0;
  const remaining = Math.max(0, totalBudget - spent);
  const spentPercent = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

  return (
    <aside
      className="fixed inset-y-0 hidden lg:flex lg:w-64 lg:flex-col"
      style={{
        background: LUMEN,
        borderRight: `1px solid ${LUMEN_DK}`,
        color: VAST,
      }}
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-6 py-6"
        style={{ borderBottom: `1px solid ${LUMEN_DK}` }}
      >
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-md"
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
        className="px-6 pt-5 pb-2 text-[10px] uppercase"
        style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.22em' }}
      >
        navigation
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
                isActive ? '' : 'hover:bg-[#ffffeb] hover:text-[#1a1a1a]'
              }`}
              style={{
                background: isActive ? WHITE : 'transparent',
                color: isActive ? VAST : MUTED,
                border: `1px solid ${isActive ? LUMEN_DK : 'transparent'}`,
                fontWeight: isActive ? 500 : 400,
                boxShadow: isActive ? '0 1px 0 rgba(0,0,0,0.03)' : 'none',
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full transition-colors group-hover:bg-[#a6a691]"
                style={{
                  background: isActive ? FATHOM : 'transparent',
                  border: isActive ? 'none' : `1px solid ${SOFT}`,
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 px-4 pb-4 pt-6">
        {active && (
          <div
            className="rounded-xl p-4"
            style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] uppercase"
                style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.18em' }}
              >
                {active.plan.planType} budget
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: FATHOM,
                  fontWeight: 600,
                }}
              >
                {spentPercent}%
              </span>
            </div>
            <div
              className="mt-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: VAST,
              }}
            >
              ₨ {remaining.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px]" style={{ color: MUTED }}>
              left of ₨ {totalBudget.toLocaleString()}
            </div>
            <div
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: LUMEN_DK }}
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
          </div>
        )}

        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px]"
            style={{
              background: FATHOM,
              color: LUMEN,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            {initials(user?.name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span
              className="truncate text-[13px]"
              style={{ color: VAST, fontWeight: 500 }}
            >
              {user?.name ?? '—'}
            </span>
            <span
              className="truncate text-[11px]"
              style={{ fontFamily: 'var(--font-mono)', color: SOFT }}
            >
              {user?.email ?? ''}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
