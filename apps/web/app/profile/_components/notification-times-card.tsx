'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveBudgetPlan, useUpdateBudgetPlan } from '@/hooks/use-budget-plan';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';

const TIME_PATTERN = /^\d{2}:\d{2}$/;

export function NotificationTimesCard() {
  const { data: active, isLoading } = useActiveBudgetPlan();
  const planId = active?.plan.id ?? '';
  const initialTimes = active?.plan.notificationTimes ?? [];

  const { mutateAsync: updatePlan, isPending } = useUpdateBudgetPlan(planId);

  const [times, setTimes] = useState<string[]>(initialTimes);

  useEffect(() => {
    setTimes(active?.plan.notificationTimes ?? []);
  }, [active?.plan.notificationTimes]);

  const isDirty =
    times.length !== initialTimes.length || times.some((t, i) => t !== initialTimes[i]);
  const allValid = times.every((t) => TIME_PATTERN.test(t));

  const add = () => setTimes((prev) => [...prev, '08:00']);
  const remove = (idx: number) => setTimes((prev) => prev.filter((_, i) => i !== idx));
  const update = (idx: number, value: string) =>
    setTimes((prev) => prev.map((t, i) => (i === idx ? value : t)));

  const save = async () => {
    try {
      await updatePlan({ notificationTimes: times });
      showToast.success({ title: 'Notification times updated' });
    } catch (err) {
      showToast.error({
        title: 'Could not save notification times',
        description: getErrorMessage(err),
      });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-44 w-full" />;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-chart-1/10">
            <Bell className="w-4 h-4 text-chart-1" />
          </div>
          <div>
            <CardTitle className="text-base text-card-foreground">Notification times</CardTitle>
            <CardDescription>
              {active
                ? 'When should we remind you to choose a meal?'
                : 'Create a budget plan to configure reminders.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!active ? null : (
          <>
            <div className="flex flex-col gap-2">
              {times.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No reminders configured. Add one below.
                </p>
              )}
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={t}
                    onChange={(e) => update(i, e.target.value)}
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(i)}
                    aria-label="Remove reminder"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={add}>
                <Plus className="w-4 h-4 mr-1" />
                Add time
              </Button>
              <Button size="sm" onClick={save} disabled={!isDirty || !allValid || isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
