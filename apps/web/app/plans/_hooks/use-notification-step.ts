'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  notificationPreferencesSchema,
  type BudgetPlanMealTypeOption,
  type NotificationPreferencesInput,
} from '@/app/plans/types';

type NotificationSlot = NotificationPreferencesInput['notificationSlots'][number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds notification slots aligned to the current meal type selection.
 * Preserves existing times where the meal type already has one set.
 * New meal types get an empty time so the user must fill them in.
 */
const buildSlotsForMealTypes = (
  current: NotificationSlot[],
  selectedMealTypeIds: string[],
): NotificationSlot[] => {
  const ids =
    selectedMealTypeIds.length > 0 ? selectedMealTypeIds : current.map((slot) => slot.mealTypeId);

  return ids.map((mealTypeId) => ({
    mealTypeId,
    time: current.find((slot) => slot.mealTypeId === mealTypeId)?.time ?? '',
  }));
};

/**
 * Returns true if two slot arrays are identical in order, id, and time.
 * Used to avoid unnecessary form updates that would trigger re-renders.
 */
const areSlotsEqual = (a: NotificationSlot[], b: NotificationSlot[]): boolean =>
  a.length === b.length &&
  a.every((slot, i) => slot.mealTypeId === b[i]?.mealTypeId && slot.time === b[i]?.time);

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
    const next = buildSlotsForMealTypes(current, selectedMealTypeIds);

    if (areSlotsEqual(current, next)) return;

    // Set without shouldValidate — user hasn't interacted yet,
    // triggering errors immediately would be jarring
    form.setValue('notificationSlots', next, { shouldDirty: true });
  }, [selectedMealTypeIds, form]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const updateNotificationTime = (mealTypeId: string, time: string) => {
    const current = form.getValues('notificationSlots');
    form.setValue(
      'notificationSlots',
      current.map((slot) => (slot.mealTypeId === mealTypeId ? { ...slot, time } : slot)),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  // ─── Watched values ──────────────────────────────────────────────────────

  const notificationSlots = form.watch('notificationSlots');

  // Enrich slots with labels for display — decoupled from raw form data
  const slots = notificationSlots.map((slot) => ({
    mealTypeId: slot.mealTypeId,
    time: slot.time,
    label: mealTypeOptions.find((opt) => opt.id === slot.mealTypeId)?.label ?? 'Meal slot',
  }));

  // ─── Exposed API ──────────────────────────────────────────────────────────

  return {
    handleSubmit: form.handleSubmit,
    trigger: form.trigger,
    getValues: () => form.getValues(),
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
    },
  };
};
