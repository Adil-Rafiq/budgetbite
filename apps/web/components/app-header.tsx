'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';
import { LogoIcon } from '@/components/icons';
import { authClient } from '@/lib/auth-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function initials(name: string | undefined): string {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.charAt(0).toUpperCase() ?? '';
  const b = parts[1]?.charAt(0).toUpperCase() ?? '';
  return `${a}${b}` || '•';
}

export function AppHeader() {
  const router = useRouter();
  const { data: active } = useActiveBudgetPlan();
  const { data: user } = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const totalBudget = active?.plan.totalBudget ?? 0;
  const spent = active?.plan.spentAmount ?? 0;
  const remaining = Math.max(0, totalBudget - spent);
  const spentPercent = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

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
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green text-white">
            <LogoIcon size={13} />
          </span>
          <span className="font-display text-base font-bold tracking-tight">
            Budget<span className="text-green">Bite</span>
          </span>
        </Link>

        <div className="hidden text-xs font-semibold uppercase tracking-widest text-slate/60 lg:block">
          Home · Dashboard
        </div>

        <div className="flex items-center gap-3">
          {active && (
            <div className="hidden items-center gap-3 rounded-full border border-sage bg-white px-4 py-1.5 shadow-sm sm:flex">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate">Left</span>
              <span className="font-display text-sm font-semibold text-charcoal">
                ₨ {remaining.toLocaleString()}
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-sage">
                <motion.div
                  className={`h-full rounded-full ${spentPercent >= 90 ? 'bg-tomato' : 'bg-green'}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(100, spentPercent)}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate">{spentPercent}%</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green text-xs font-semibold text-white transition-all hover:bg-dark-green active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
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
