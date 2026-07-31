'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { LogoIcon } from '@/components/icons';
import { authClient } from '@/lib/auth-client';
import { formatPKR } from '@/lib/currency';
import { FOCUS_RING_ON_CANVAS } from '@/lib/focus-ring';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * The desktop breadcrumb used to be the literal string "Home · Dashboard" on
 * every route, so `/plans/[id]` announced "Dashboard" directly above a page
 * headed "Budget plans". A breadcrumb that cannot be wrong is one derived from
 * where you actually are.
 */
const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  plans: 'Budget plans',
  restaurants: 'Restaurants',
  analytics: 'Analytics',
  profile: 'Profile',
  onboarding: 'Setup',
};

function breadcrumbFor(pathname: string): string {
  const [section, second] = pathname.split('/').filter(Boolean);
  if (!section) return 'Home';

  const label = SECTION_LABELS[section] ?? section.charAt(0).toUpperCase() + section.slice(1);
  // A nested id segment means "inside" that section, not a new one.
  const isDetail = !!second && !SECTION_LABELS[second];
  return isDetail ? `Home · ${label} · Detail` : `Home · ${label}`;
}

function initials(name: string | undefined): string {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.charAt(0).toUpperCase() ?? '';
  const b = parts[1]?.charAt(0).toUpperCase() ?? '';
  return `${a}${b}` || '•';
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: active } = useActiveBudgetPlan();
  const { data: user } = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const prefersReducedMotion = useReducedMotion();

  // Prefer the pin-adjusted budgetState (the same source the dashboard budget
  // card reads) so every budget figure in the shell agrees; fall back to plan
  // totals. Remaining is honest — negative when over — and the pill labels it.
  const bs = active?.budgetState;
  const totalBudget = bs?.totalBudget ?? active?.plan.totalBudget ?? 0;
  const spent = bs?.amountSpent ?? active?.plan.spentAmount ?? 0;
  const remaining = bs ? bs.amountRemaining : totalBudget - spent;
  const spentPercent = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
  const isOver = remaining < 0;
  // The number every budget-fit badge in the app is actually measured against.
  // The pill carried only `remaining`, so on the restaurants and menu surfaces
  // — the long scrolling ones — "Tight" and "Fits budget" became unanchored
  // adjectives the moment the page header left the viewport, and the user had
  // to scroll up, memorise a figure and scroll back to do the comparison the
  // app exists to do for them. It travels with them now.
  const perMeal = bs?.avgBudgetPerRemainingMeal ?? 0;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push('/login');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-sage bg-canvas/85"
      style={{ backdropFilter: 'saturate(180%) blur(10px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
        {/* Mobile logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-deep text-white">
            <LogoIcon size={13} />
          </span>
          <span className="font-display text-base font-bold tracking-tight">
            Budget<span className="text-green">Bite</span>
          </span>
        </Link>

        <div className="hidden text-xs font-semibold uppercase tracking-widest text-slate lg:block">
          {breadcrumbFor(pathname)}
        </div>

        <div className="flex items-center gap-3">
          {/* Budget pill: only where the sidebar's persistent budget card is not
              visible (below lg). On desktop the sidebar already shows this, so
              the pill would be a third copy of the same number. */}
          {active && (
            <div className="flex items-center gap-2.5 rounded-full border border-sage bg-white px-3.5 py-1.5 shadow-sm sm:gap-3 sm:px-4 lg:hidden">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate">
                {isOver ? 'Over' : 'Left'}
              </span>
              <span
                className={`font-display text-sm font-semibold tabular-nums ${
                  isOver ? 'text-tomato-ink' : 'text-charcoal'
                }`}
              >
                {formatPKR(Math.abs(remaining))}
              </span>
              {perMeal > 0 && (
                <span className="text-[11px] font-medium tabular-nums text-slate">
                  · {formatPKR(perMeal)}
                  <span className="text-[10px]">/meal</span>
                </span>
              )}
              <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-sage sm:block">
                <motion.div
                  className={`h-full rounded-full ${
                    isOver || spentPercent >= 90 ? 'bg-tomato' : 'bg-green'
                  }`}
                  initial={prefersReducedMotion ? false : { width: '0%' }}
                  animate={{ width: `${Math.min(100, spentPercent)}%` }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }
                  }
                />
              </div>
              <span className="hidden text-[10px] font-medium text-slate sm:block">
                {spentPercent}%
              </span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`inline-flex size-11 items-center justify-center rounded-full bg-green-deep text-xs font-semibold text-white transition-all hover:bg-green-deeper active:scale-95 sm:size-9 ${FOCUS_RING_ON_CANVAS}`}
                aria-label={user?.name ? `Account menu for ${user.name}` : 'Account menu'}
              >
                {initials(user?.name)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="min-w-[220px]">
              {user && (
                <>
                  <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
                    <span className="truncate text-[13px] font-medium text-charcoal">
                      {user.name || '—'}
                    </span>
                    <span className="truncate text-[11px] text-slate">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  handleSignOut();
                }}
                disabled={signingOut}
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
