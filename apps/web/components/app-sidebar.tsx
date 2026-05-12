'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { LogoIcon } from '@/components/icons';

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
    <aside className="fixed inset-y-0 hidden border-r border-lumen-dk bg-lumen text-vast lg:flex lg:w-64 lg:flex-col">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 border-b border-lumen-dk px-6 py-6"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-fathom text-lumen">
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
        className="px-6 pt-5 pb-2 text-[10px] uppercase text-soft"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
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
              className={`group flex items-center gap-3 rounded-lg border px-3 py-2 text-[14px] transition-colors ${
                isActive
                  ? 'border-lumen-dk bg-white font-medium text-vast shadow-[0_1px_0_rgba(0,0,0,0.03)]'
                  : 'border-transparent bg-transparent font-normal text-ink hover:bg-lumen hover:text-vast'
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full transition-colors group-hover:bg-soft ${
                  isActive ? 'border-0 bg-fathom' : 'border border-soft bg-transparent'
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 px-4 pb-4 pt-6">
        {active && (
          <div className="rounded-xl border border-lumen-dk bg-white p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] uppercase text-soft"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
              >
                {active.plan.planType} budget
              </span>
              <span
                className="text-fathom"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {spentPercent}%
              </span>
            </div>
            <div
              className="mt-3 text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              ₨ {remaining.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-ink">
              left of ₨ {totalBudget.toLocaleString()}
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-lumen-dk">
              <motion.div
                className={`h-full rounded-full ${spentPercent >= 90 ? 'bg-pulse' : 'bg-fathom'}`}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(100, spentPercent)}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-xl border border-lumen-dk bg-white px-3 py-2.5">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fathom text-[11px] text-lumen"
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
          >
            {initials(user?.name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium text-vast">
              {user?.name ?? '—'}
            </span>
            <span
              className="truncate text-[11px] text-soft"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {user?.email ?? ''}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
