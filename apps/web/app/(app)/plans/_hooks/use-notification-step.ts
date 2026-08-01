'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  notificationPreferencesSchema,
  type BudgetPlanMealTypeOption,
  type NotificationPreferencesInput,
} from '@/lib/budget-plan/schema';
import { areSlotsEqual, buildSlotsForMealTypes } from '@/lib/budget-plan/reminders';
import { PLANS_DRAFT_KEY } from '@/app/(app)/plans/_lib/draft';
import { patchDraftIn, readDraftFrom } from '@/lib/budget-plan/draft-storage';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useNotificationStep = (
  selectedMealTypeIds: string[],
  mealTypeOptions: BudgetPlanMealTypeOption[],
) => {
  const form = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      notificationSlots: [],
    },
  });

  const restoredDraft = useRef(false);

  // Restore reminder times before the reconciliation effect runs, so a restored
  // slot counts as "existing" and keeps its time instead of reverting to the
  // per-meal default.
  useEffect(() => {
    if (restoredDraft.current) return;
    restoredDraft.current = true;

    const slots = readDraftFrom(PLANS_DRAFT_KEY).notificationSlots;
    if (slots?.length) form.setValue('notificationSlots', slots);
  }, [form]);

  // Sync slots when the meal-type selection changes. New meal types arrive
  // pre-filled with a sensible time (see `buildSlotsForMealTypes`) — this step
  // used to seed them empty, which made it invalid on arrival and turned "Next"
  // into a silent no-op.
  useEffect(() => {
    const current = form.getValues('notificationSlots');
    const next = buildSlotsForMealTypes(current, selectedMealTypeIds, mealTypeOptions);

    if (areSlotsEqual(current, next)) return;

    // Set without shouldValidate — the user hasn't interacted yet, and
    // triggering errors immediately would be jarring.
    form.setValue('notificationSlots', next, { shouldDirty: true });
  }, [selectedMealTypeIds, mealTypeOptions, form]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const updateNotificationTime = (mealTypeId: string, time: string) => {
    const current = form.getValues('notificationSlots');
    form.setValue(
      'notificationSlots',
      current.map((slot) => (slot.mealTypeId === mealTypeId ? { ...slot, time } : slot)),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const toggleNotificationEnabled = (mealTypeId: string) => {
    const current = form.getValues('notificationSlots');
    form.setValue(
      'notificationSlots',
      current.map((slot) =>
        slot.mealTypeId === mealTypeId ? { ...slot, enabled: !slot.enabled } : slot,
      ),
      { shouldDirty: true },
    );
  };

  // ─── Watched values ──────────────────────────────────────────────────────

  const notificationSlots = form.watch('notificationSlots');

  // Mirror to the draft so an interruption restores the times the user set, not
  // the defaults they had already replaced.
  useEffect(() => {
    if (notificationSlots.length === 0) return;
    patchDraftIn(PLANS_DRAFT_KEY, { notificationSlots });
  }, [notificationSlots]);

  // Enrich slots with labels for display — decoupled from raw form data.
  const slots = notificationSlots.map((slot) => ({
    mealTypeId: slot.mealTypeId,
    time: slot.time,
    enabled: slot.enabled,
    label: mealTypeOptions.find((opt) => opt.id === slot.mealTypeId)?.label ?? 'Meal slot',
  }));

  /**
   * Per-row messages. React-hook-form files item failures under
   * `notificationSlots[i].time`, so reading `.message` off the array — as this
   * step used to — returns `undefined` and renders nothing while validation
   * quietly blocks the user.
   */
  const slotErrors = notificationSlots.map(
    (_, i) => form.formState.errors.notificationSlots?.[i]?.time?.message,
  );

  /** Mirrors `useBudgetStep.reset`: clear, then re-apply any surviving draft. */
  const reset = useCallback(() => {
    const slots = readDraftFrom(PLANS_DRAFT_KEY).notificationSlots;
    form.reset({ notificationSlots: slots?.length ? slots : [] });
  }, [form]);

  return {
    handleSubmit: form.handleSubmit,
    trigger: form.trigger,
    getValues: () => form.getValues(),
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    reset,

    values: {
      slots,
      reminderText: `Set one reminder per meal slot (${slots.length} total).`,
    },

    errors: {
      notificationSlots: form.formState.errors.notificationSlots?.message,
      slots: slotErrors,
    },

    actions: {
      updateNotificationTime,
      toggleNotificationEnabled,
    },
  };
};
