'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  notificationPreferencesSchema,
  type BudgetPlanMealTypeOption,
  type NotificationPreferencesInput,
} from '@/app/onboarding/types';

type NotificationSlot = NotificationPreferencesInput['notificationSlots'][number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sensible default reminder times per meal, keyed by meal-type key. New slots
 * start pre-filled with these so the user can finish onboarding without opening
 * a single time picker — they only adjust the ones they care about. Unknown
 * keys fall back to midday.
 */
const DEFAULT_TIME_BY_KEY: Record<string, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '20:00',
  snack: '16:00',
};
const FALLBACK_TIME = '12:00';

const defaultTimeForMealType = (option?: BudgetPlanMealTypeOption): string =>
  (option && DEFAULT_TIME_BY_KEY[option.key]) ?? FALLBACK_TIME;

/**
 * Builds notification slots aligned to the current meal type selection.
 * Preserves existing times where the meal type already has one set; new meal
 * types get a sensible default time so the plan can be launched as-is.
 */
const buildSlotsForMealTypes = (
  current: NotificationSlot[],
  selectedMealTypeIds: string[],
  mealTypeOptions: BudgetPlanMealTypeOption[],
): NotificationSlot[] => {
  const ids =
    selectedMealTypeIds.length > 0 ? selectedMealTypeIds : current.map((slot) => slot.mealTypeId);

  return ids.map((mealTypeId) => {
    const existing = current.find((slot) => slot.mealTypeId === mealTypeId);
    const option = mealTypeOptions.find((opt) => opt.id === mealTypeId);
    return {
      mealTypeId,
      // `||` (not `??`) so a previously empty time is replaced with a default.
      time: existing?.time || defaultTimeForMealType(option),
      enabled: existing?.enabled ?? true,
    };
  });
};

/**
 * Returns true if two slot arrays are identical in order, id, time, and enabled.
 * Used to avoid unnecessary form updates that would trigger re-renders.
 */
const areSlotsEqual = (a: NotificationSlot[], b: NotificationSlot[]): boolean =>
  a.length === b.length &&
  a.every(
    (slot, i) =>
      slot.mealTypeId === b[i]?.mealTypeId &&
      slot.time === b[i]?.time &&
      slot.enabled === b[i]?.enabled,
  );

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

  // Sync notification slots when selected meal types change.
  // Preserves existing times, adds empty slots for new meal types,
  // removes slots for deselected meal types.
  useEffect(() => {
    const current = form.getValues('notificationSlots');
    const next = buildSlotsForMealTypes(current, selectedMealTypeIds, mealTypeOptions);

    if (areSlotsEqual(current, next)) return;

    // Set without shouldValidate — user hasn't interacted yet,
    // triggering errors immediately would be jarring
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

  // Enrich slots with labels for display — decoupled from raw form data
  const slots = notificationSlots.map((slot) => ({
    mealTypeId: slot.mealTypeId,
    time: slot.time,
    enabled: slot.enabled,
    label: mealTypeOptions.find((opt) => opt.id === slot.mealTypeId)?.label ?? 'Meal slot',
  }));

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    handleSubmit: form.handleSubmit,
    trigger: form.trigger,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,

    values: {
      slots,
      reminderText: `Set one reminder per meal slot (${slots.length} total).`,
    },

    errors: {
      notificationSlots: form.formState.errors.notificationSlots?.message,
    },

    actions: {
      updateNotificationTime,
      toggleNotificationEnabled,
    },
  };
};
