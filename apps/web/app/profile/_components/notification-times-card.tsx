'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

import { TimePicker } from '@/components/ui/time-picker';
import { useActiveBudgetPlan, useUpdateBudgetPlan } from '@/hooks/use-budget-plan';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { Section } from '@/app/profile/_components/section';

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
    return <div className="h-64 w-full animate-pulse rounded-2xl bg-sage" />;
  }

  const hint = active ? 'When should we remind you?' : 'Create a plan to configure reminders.';

  return (
    <Section icon={Bell} title="Notification times" hint={hint}>
      <div className="flex flex-col gap-4">
        {!active ? (
          <p className="text-[13px] text-slate">No active plan yet.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {slots.length === 0 && (
                <p className="text-[12px] text-slate/60">No reminders configured. Add one below.</p>
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
                  <button
                    type="button"
                    onClick={() => toggleEnabled(i)}
                    aria-pressed={slot.enabled}
                    aria-label={slot.enabled ? 'Disable reminder' : 'Enable reminder'}
                    className={`inline-flex min-w-[52px] items-center justify-center rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      slot.enabled
                        ? 'border-green bg-green/10 text-dark-green'
                        : 'border-sage bg-canvas text-slate hover:border-green/40'
                    }`}
                  >
                    {slot.enabled ? 'On' : 'Off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label="Remove reminder"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-canvas hover:text-tomato"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas"
              >
                <Plus className="h-3.5 w-3.5" />
                Add time
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!isDirty || !allValid || isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
