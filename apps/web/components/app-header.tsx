'use client';

import { UtensilsCrossed } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useUser } from '@/hooks/use-user';

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
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">BudgetBite</span>
        </div>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-4">
          {active && (
            <div className="hidden sm:flex items-center gap-3 bg-secondary rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  PKR {remaining.toLocaleString()}
                </span>{' '}
                remaining
              </div>
              <Progress value={spentPercent} className="w-24 h-2" />
            </div>
          )}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
