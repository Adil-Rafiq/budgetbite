'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, LayoutDashboard, Receipt, User, UtensilsCrossed, Store } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/plans', label: 'Plans', icon: Receipt },
  { href: '/restaurants', label: 'Restaurants', icon: Store },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
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
  const spentPercent = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
          <UtensilsCrossed className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">BudgetBite</span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {active && (
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-sidebar-foreground/70 capitalize">
                {active.plan.planType} budget
              </span>
              <span className="font-semibold text-sidebar-primary">{spentPercent}%</span>
            </div>
            <Progress
              value={spentPercent}
              className="h-2 bg-sidebar-border [&>div]:bg-sidebar-primary"
            />
            <div className="flex items-center justify-between text-xs mt-2 text-sidebar-foreground/70">
              <span>PKR {spent.toLocaleString()}</span>
              <span>PKR {totalBudget.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{user?.name ?? '—'}</span>
            <span className="text-xs text-sidebar-foreground/60 truncate">{user?.email ?? ''}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
