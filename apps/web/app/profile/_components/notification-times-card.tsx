'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

import { Pill } from '@/components/ui/pill';
import { TimePicker } from '@/components/ui/time-picker';
import { useActiveBudgetPlan, useUpdateBudgetPlan } from '@/hooks/use-budget-plan';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';

const TIME_PATTERN = /^\d{2}:\d{2}$/;

type Slot = { time: string; enabled: boolean };

export function NotificationTimesCard() {
  const { data: active, isLoading } = useActiveBudgetPlan();
  const planId = active?.plan.id ?? '';
  const initialSlots: Slot[] = active?.plan.notificationTimes ?? [];

  const { mutateAsync: updatePlan, isPending } = useUpdateBudgetPlan(planId);

  const [slots, setSlots] = useState<Slot[]>(initialSlots);

  useEffect(() => {
    setSlots(active?.plan.notificationTimes ?? []);
  }, [active?.plan.notificationTimes]);

  const isDirty =
    slots.length !== initialSlots.length ||
    slots.some(
      (s, i) => s.time !== initialSlots[i]?.time || s.enabled !== initialSlots[i]?.enabled,
    );
  const allValid = slots.every((s) => TIME_PATTERN.test(s.time));

  const add = () => setSlots((prev) => [...prev, { time: '08:00', enabled: true }]);
  const remove = (idx: number) => setSlots((prev) => prev.filter((_, i) => i !== idx));
  const updateTime = (idx: number, time: string) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, time } : s)));
  const toggleEnabled = (idx: number) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s)));

  const save = async () => {
    try {
      await updatePlan({ notificationTimes: slots });
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
              {slots.length === 0 && (
                <p className="text-[12px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
                  no reminders configured. add one below.
                </p>
              )}
              {slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TimePicker
                    value={slot.time}
                    onChange={(next) => updateTime(i, next)}
                    disabled={!slot.enabled}
                    size="md"
                    aria-label={`Reminder ${i + 1} time`}
                  />
                  <Pill
                    variant={slot.enabled ? 'primary' : 'ghost'}
                    size="xs"
                    onClick={() => toggleEnabled(i)}
                    aria-pressed={slot.enabled}
                    aria-label={slot.enabled ? 'Disable reminder' : 'Enable reminder'}
                    className="min-w-[52px] justify-center"
                  >
                    {slot.enabled ? 'On' : 'Off'}
                  </Pill>
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
