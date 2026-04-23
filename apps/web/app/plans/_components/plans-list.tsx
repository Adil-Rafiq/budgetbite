'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CalendarDays } from 'lucide-react';
import { useBudgetPlans } from '@/hooks/use-budget-plan';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(dateStr).toLocaleDateString('en-PK', opts);

const statusStyles: Record<string, string> = {
  active: 'bg-accent/10 text-accent border-0',
  completed: 'bg-chart-3/10 text-chart-3 border-0',
  cancelled: 'bg-destructive/10 text-destructive border-0',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlansListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-4 w-48" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-12 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PlansListError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function PlansListEmpty() {
  return (
    <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
      No plans found. Create one to get started.
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlansList() {
  const { data: plansWithMeta, isLoading, error } = useBudgetPlans({ limit: 10, offset: 0 });

  if (isLoading) return <PlansListSkeleton />;

  if (error) return <PlansListError message={`Failed to load budget plan: ${error.message}`} />;

  if (!plansWithMeta || !plansWithMeta.data?.length) return <PlansListEmpty />;

  // TODO: Implement pagination using the `meta`
  const { data: plans, meta } = plansWithMeta;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {plans.map((plan) => {
        const spent = plan.spentAmount;
        const spentPercent = Math.round((spent / plan.totalBudget) * 100);
        const remaining = plan.totalBudget - spent;

        return (
          <Card key={plan.id} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize text-card-foreground">
                  {plan.planType} Plan
                </CardTitle>
                <Badge variant="secondary" className={statusStyles[plan.status]}>
                  {plan.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {/* Date range */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>
                  {formatDate(plan.startDate, { month: 'short', day: 'numeric' })}
                  {' – '}
                  {formatDate(plan.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {/* Spend progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">PKR {spent.toLocaleString()} spent</span>
                  <span className="font-semibold text-card-foreground">
                    PKR {plan.totalBudget.toLocaleString()}
                  </span>
                </div>
                <Progress value={spentPercent} className="h-2" />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Budget', value: `${(plan.totalBudget / 1000).toFixed(0)}k` },
                  { label: 'Spent', value: `${(spent / 1000).toFixed(1)}k` },
                  {
                    label: 'Left',
                    value: remaining > 0 ? `${(remaining / 1000).toFixed(1)}k` : '0',
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-secondary p-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-card-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Meal type badges */}
              <div className="flex flex-wrap gap-1.5">
                {plan.mealTypes.map((mt) => (
                  <Badge key={mt.id} variant="outline" className="text-xs capitalize">
                    {mt.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
