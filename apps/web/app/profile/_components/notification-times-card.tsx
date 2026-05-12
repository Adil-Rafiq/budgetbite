'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { useActiveBudgetPlan, useUpdateBudgetPlan } from '@/hooks/use-budget-plan';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

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
    return (
      <div className="h-44 w-full animate-pulse rounded-2xl" style={{ background: LUMEN_DK }} />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: WHITE,
        border: `1px solid ${LUMEN_DK}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div
        className="flex items-center justify-between gap-3 border-b px-5 py-4"
        style={{ borderColor: LUMEN_DK, background: LUMEN }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${FATHOM}14`, color: FATHOM }}
          >
            <Bell className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span
              className="text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-mono)', color: SOFT, letterSpacing: '0.22em' }}
            >
              04
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 600,
                color: VAST,
                letterSpacing: '-0.01em',
              }}
            >
              Notification times
            </span>
          </div>
        </div>
        <p className="hidden text-right text-[12px] sm:block" style={{ color: MUTED, maxWidth: 280 }}>
          {active ? 'When should we remind you?' : 'Create a plan to configure reminders.'}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {!active ? (
          <p className="text-[13px]" style={{ color: MUTED }}>
            No active plan yet.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {times.length === 0 && (
                <p className="text-[12px]" style={{ fontFamily: 'var(--font-mono)', color: SOFT }}>
                  no reminders configured. add one below.
                </p>
              )}
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={t}
                    onChange={(e) => update(i, e.target.value)}
                    className="w-32"
                    style={{
                      background: LUMEN,
                      borderColor: LUMEN_DK,
                      color: VAST,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <button
                    onClick={() => remove(i)}
                    aria-label="Remove reminder"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:opacity-80"
                    style={{ color: MUTED }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={add}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] transition"
                style={{ border: `1px solid ${LUMEN_DK}`, background: WHITE, color: VAST }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add time
              </button>
              <button
                onClick={save}
                disabled={!isDirty || !allValid || isPending}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-medium transition disabled:opacity-40"
                style={{ background: VAST, color: LUMEN }}
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
