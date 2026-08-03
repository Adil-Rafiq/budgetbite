'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Plus, Trash2 } from 'lucide-react';

import { TimePicker } from '@/components/ui/time-picker';
import { Section } from '@/app/(app)/profile/_components/section';
import { SaveRow } from '@/app/(app)/profile/_components/save-row';
import { useActiveBudgetPlan, useUpdateBudgetPlan } from '@/hooks/use-budget-plan';
import { FOCUS_RING } from '@/lib/focus-ring';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

/**
 * Candidates for "Add time", in the order we'd like to hand them out: the three
 * meal times first, then every other hour, de-duplicated. `add()` takes the
 * first one not already in use, so pressing it repeatedly never stacks two
 * identical reminders — and once all 24 are spoken for the button turns off
 * rather than falling back to a duplicate forever.
 */
const CANDIDATE_TIMES = Array.from(
  new Set([
    '08:00',
    '13:00',
    '19:00',
    ...Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`),
  ]),
);

type Slot = { time: string; enabled: boolean };

const sameSlots = (a: Slot[], b: Slot[]) =>
  a.length === b.length && a.every((s, i) => s.time === b[i]?.time && s.enabled === b[i]?.enabled);

/**
 * Reminders belong to the **active budget plan**, not to the account — this
 * card writes `budgetPlan.notificationTimes`. The old copy ("Notification
 * times", "Create a plan to configure reminders") presented a plan property as
 * an account setting and then leaked the data model when there wasn't one. It
 * says whose reminders these are now, and links to the plan they live on.
 */
export function NotificationTimesCard({
  onDirtyChange,
}: {
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { data: active, isPending: isLoadingPlan } = useActiveBudgetPlan();
  const planId = active?.plan.id ?? '';
  const saved: Slot[] = active?.plan.notificationTimes ?? [];

  const { mutateAsync: updatePlan, isPending } = useUpdateBudgetPlan(planId);

  // `null` means "not seeded from the server yet" — distinct from "seeded, and
  // the user deleted every reminder". Without that distinction the first render
  // (plan still loading, so `saved` is `[]`) would seed an empty editor, and the
  // moment the plan arrived the card would compare `[]` against real reminders,
  // call itself dirty, and refuse to adopt them.
  const [draft, setDraft] = useState<Slot[] | null>(null);
  const slots = draft ?? saved;
  const listRef = useRef<HTMLDivElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Only meaningful while there is a plan to be dirty about. Without the
  // `!!active` guard, a plan cancelled in another tab left `draft` non-null
  // against an empty `saved`, so the card reported itself dirty forever from
  // inside the empty state — no badge, no form, no Save, no Revert, and every
  // navigation on the page silently blocked by an edit nobody could see.
  const isDirty = !!active && draft !== null && !sameSlots(draft, saved);

  const setSlots = (next: Slot[] | ((prev: Slot[]) => Slot[])) =>
    setDraft((prev) => (typeof next === 'function' ? next(prev ?? saved) : next));

  // Drop the local draft once it matches the server again — after a save, or
  // after a Revert — so later server changes flow through. It deliberately does
  // *not* run while the draft differs: any plan refetch, including one caused by
  // saving a different card on this page, used to reset this editor mid-edit.
  useEffect(() => {
    if (isDirty) return;
    setDraft(null);
  }, [active?.plan.notificationTimes, isDirty]);

  // Abandon the draft outright if the plan it belonged to is gone.
  useEffect(() => {
    if (!active) setDraft(null);
  }, [active]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const nextFreeTime = CANDIDATE_TIMES.find((t) => !slots.some((s) => s.time === t));

  const add = () => {
    if (!nextFreeTime) return;
    setSlots((prev) => [...prev, { time: nextFreeTime, enabled: true }]);
  };

  /**
   * Deleting a row unmounts the button that had focus, which dropped the caret
   * to `<body>` — a keyboard user was silently teleported to the top of a very
   * long page. Move focus to the row that took its place, or to the last one.
   */
  const remove = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
    requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-remove-slot]');
      if (!buttons?.length) return;
      (buttons[Math.min(idx, buttons.length - 1)] ?? buttons[buttons.length - 1])?.focus();
    });
  };
  const updateTime = (idx: number, time: string) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, time } : s)));
  const toggleEnabled = (idx: number) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s)));

  // How many reminders sit on an already-used time — a count of *reminders*,
  // not of distinct times. The copy previously read the list of duplicated
  // values and called it "Two reminders", so three at 08:00 announced two.
  const duplicateCount = slots.filter(
    (s, i) => slots.findIndex((o) => o.time === s.time) !== i,
  ).length;
  const duplicateTimes = Array.from(
    new Set(
      slots.filter((s, i) => slots.findIndex((o) => o.time === s.time) !== i).map((s) => s.time),
    ),
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      await updatePlan({ notificationTimes: slots });
      showToast.success({ title: 'Reminders updated' });
    } catch (err) {
      const message = getErrorMessage(err);
      setSaveError(message);
      showToast.error({ title: 'Could not save reminders', description: message });
    }
  };

  if (isLoadingPlan) {
    return (
      <div
        role="status"
        aria-label="Loading your reminders"
        className="h-[360px] w-full animate-pulse rounded-2xl border border-sand bg-surface shadow-sm"
      />
    );
  }

  if (!active) {
    return (
      <Section icon={Bell} title="Meal reminders" hint="Reminders belong to a budget plan.">
        <div className="flex flex-1 flex-col gap-3">
          <div className="rounded-xl border border-dashed border-sand bg-canvas px-4 py-3">
            <p className="text-[13px] text-slate">
              You don&apos;t have an active plan, so there is nothing to be reminded about yet.{' '}
              <Link
                href="/plans"
                className={`rounded text-teal-ink underline-offset-2 hover:underline ${FOCUS_RING}`}
              >
                Start a budget plan
              </Link>{' '}
              and you can set reminder times as part of it.
            </p>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section
      icon={Bell}
      title="Meal reminders"
      hint="When to nudge you during your current plan."
      isDirty={isDirty}
    >
      <form className="flex flex-1 flex-col gap-4" onSubmit={save} noValidate>
        {/* The route out to the plan these belong to. The docblock above has
            claimed this link existed since the card was written; it only ever
            rendered in the empty state, so a user with an active plan read a
            heading about their plan and had no way to reach it. */}
        <p className="text-[12px] text-slate">
          These belong to your active plan.{' '}
          <Link
            href={`/plans/${planId}`}
            className={`rounded font-medium text-teal-ink underline-offset-2 hover:underline ${FOCUS_RING}`}
          >
            Open the plan
          </Link>{' '}
          to change its budget or dates.
        </p>

        <div ref={listRef} className="flex flex-col gap-2">
          {slots.length === 0 && (
            <p className="text-[12px] text-slate">No reminders yet. Add one below.</p>
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
              {/* Each control names its own time. Four reminders used to give a
                  screen reader four identical "Disable reminder" buttons. */}
              <button
                type="button"
                onClick={() => toggleEnabled(i)}
                aria-pressed={slot.enabled}
                aria-label={
                  slot.enabled
                    ? `Disable reminder at ${slot.time}`
                    : `Enable reminder at ${slot.time}`
                }
                className={`inline-flex min-h-11 min-w-[56px] items-center justify-center rounded-xl border px-3 text-[12px] font-medium transition-colors ${FOCUS_RING} ${
                  slot.enabled
                    ? 'border-teal bg-teal/10 text-teal-ink'
                    : 'border-sand bg-canvas text-slate hover:border-teal/40'
                }`}
              >
                {slot.enabled ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                data-remove-slot
                onClick={() => remove(i)}
                aria-label={`Remove reminder at ${slot.time}`}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate transition-colors hover:bg-canvas hover:text-tomato-ink ${FOCUS_RING}`}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* `status`, not `alert`: this is a warning that doesn't block saving,
            and as an alert it re-interrupted on every keystroke of an edit. */}
        {duplicateCount > 0 && (
          <p role="status" className="text-[11px] font-medium text-amber-ink">
            {duplicateCount === 1
              ? `Two reminders share ${duplicateTimes[0]}, so you'll be nudged twice then.`
              : `${duplicateCount + duplicateTimes.length} reminders share the same times (${duplicateTimes.join(', ')}), so some will repeat.`}
          </p>
        )}

        <button
          type="button"
          onClick={add}
          disabled={!nextFreeTime}
          className={`inline-flex min-h-11 w-fit items-center gap-1.5 rounded-xl border px-4 text-[13px] font-medium transition-colors ${FOCUS_RING} ${
            nextFreeTime
              ? 'border-sand bg-surface text-slate hover:bg-canvas'
              : 'cursor-not-allowed border-sand bg-canvas text-slate'
          }`}
        >
          <Plus aria-hidden className="h-3.5 w-3.5" />
          {nextFreeTime ? 'Add time' : 'Every hour is taken'}
        </button>

        {saveError && (
          <p role="alert" className="text-[12px] font-medium text-tomato-ink">
            {saveError}
          </p>
        )}

        <SaveRow
          isDirty={isDirty}
          isSubmitting={isPending}
          onRevert={() => {
            setDraft(null);
            setSaveError(null);
          }}
        />
      </form>
    </Section>
  );
}
