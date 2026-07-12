'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  LayoutGrid,
  CalendarDays,
  Store,
  BarChart3,
  User as UserIcon,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { LogoIcon } from '@/components/icons';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/restaurants', label: 'Restaurants', icon: Store },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: UserIcon },
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

  const items =
    user?.role === 'admin'
      ? [...navItems, { href: '/admin', label: 'Admin', icon: ShieldCheck }]
      : navItems;

  return (
    <aside className="fixed inset-y-0 hidden border-r border-sage bg-white text-charcoal lg:flex lg:w-64 lg:flex-col">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 border-b border-sage px-6 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-white shadow-sm">
          <LogoIcon size={16} />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">
          Budget<span className="text-green">Bite</span>
        </span>
      </Link>

      {/* User profile */}
      <div className="border-b border-sage/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green text-sm font-semibold text-white"
            style={{ boxShadow: '0 0 0 2px #8cc63f, 0 0 0 4px #f0f9e0' }}
          >
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-charcoal">
              {user?.name ?? '—'}
            </p>
            <p className="truncate text-xs text-slate">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-slate/60">
          Main
        </p>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                isActive
                  ? 'bg-[#f0f9e0] text-dark-green'
                  : 'text-slate hover:bg-canvas hover:text-charcoal'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? 'bg-green/15 text-green' : 'border border-sage bg-canvas text-slate'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Budget mini-card */}
      {active && (
        <div className="mt-auto px-4 pb-5 pt-2">
          <div className="rounded-2xl border border-sage bg-canvas p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate">
                {active.plan.planType} budget
              </span>
              <span className="text-xs font-bold text-dark-green">{spentPercent}%</span>
            </div>
            <div className="mt-2.5 font-display text-2xl font-bold tracking-tight text-charcoal">
              ₨ {remaining.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-slate">
              left of ₨ {totalBudget.toLocaleString()}
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sage">
              <motion.div
                className={`h-full rounded-full ${spentPercent >= 90 ? 'bg-tomato' : 'bg-green'}`}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(100, spentPercent)}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
