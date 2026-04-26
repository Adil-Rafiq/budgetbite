'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useMealChoices } from '@/hooks/use-meal-choice';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';

const mealTypeBadge: Record<string, string> = {
  breakfast: 'bg-chart-1/10 text-chart-1',
  lunch: 'bg-chart-4/10 text-chart-4',
  dinner: 'bg-chart-3/10 text-chart-3',
};

export function RecentActivity() {
  const { data: activePlan } = useActiveBudgetPlan();
  const planId = activePlan?.plan.id ?? '';
  const { data, isLoading, error } = useMealChoices(planId, { limit: 5, offset: 0 });
  const { data: mealTypes = [] } = useListActiveMealTypes();

  const mealTypesById = new Map(mealTypes.map((mt) => [mt.id, mt]));

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base text-card-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Could not load recent activity.</p>
        ) : !planId ? (
          <p className="text-sm text-muted-foreground">No active plan yet.</p>
        ) : !data?.data.length ? (
          <p className="text-sm text-muted-foreground">
            No meals logged yet. Choose one from the slots above to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.data.map((item) => {
              const mt = mealTypesById.get(item.mealTypeId);
              const label = mt?.label ?? 'Meal';
              const key = mt?.key.toLowerCase() ?? '';
              const badgeClass = mealTypeBadge[key] ?? '';
              const name = item.manualDescription ?? 'Suggested meal';
              const restaurant = item.restaurantName ?? '—';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs capitalize ${badgeClass}`}
                    >
                      {label}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{restaurant}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-card-foreground">
                      PKR {item.actualAmountSpent.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.slotDate).toLocaleDateString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
