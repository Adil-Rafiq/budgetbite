'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/pill';
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
    return <div className="h-44 w-full animate-pulse rounded-2xl bg-lumen-dk" />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between gap-3 border-b border-lumen-dk bg-lumen px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fathom/[0.08] text-fathom">
            <Bell className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span
              className="text-[10px] uppercase text-soft"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              04
            </span>
            <span
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Notification times
            </span>
          </div>
        </div>
        <p className="hidden max-w-[280px] text-right text-[12px] text-ink sm:block">
          {active ? 'When should we remind you?' : 'Create a plan to configure reminders.'}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {!active ? (
          <p className="text-[13px] text-ink">No active plan yet.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {times.length === 0 && (
                <p className="text-[12px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
                  no reminders configured. add one below.
                </p>
              )}
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={t}
                    onChange={(e) => update(i, e.target.value)}
                    className="w-32 border-lumen-dk bg-lumen text-vast"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <Pill
                    variant="subtle"
                    size="iconSm"
                    onClick={() => remove(i)}
                    aria-label="Remove reminder"
                    className="text-ink"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Pill>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Pill variant="ghost" size="xs" onClick={add}>
                <Plus className="h-3.5 w-3.5" />
                Add time
              </Pill>
              <Pill size="xs" onClick={save} disabled={!isDirty || !allValid || isPending}>
                {isPending ? 'Saving…' : 'Save'}
              </Pill>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
