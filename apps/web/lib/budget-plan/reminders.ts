import type { BudgetPlanMealTypeOption, NotificationSlotInput } from '@/lib/budget-plan/schema';

/**
 * Reminder-slot construction, shared by onboarding and the /plans wizard.
 *
 * The plans dialog used to seed every new slot with an empty time. Since the
 * slot schema requires HH:MM, that made the step invalid the moment it
 * rendered — and because its only error outlet read the *array's* `.message`
 * while react-hook-form files per-item failures under `notificationSlots[i]`,
 * the user got an enabled green "Next" that moved nowhere and said nothing.
 * Pre-filling is the fix: the step can be completed without opening a single
 * picker, and the user adjusts only the times they care about.
 */

const DEFAULT_TIME_BY_KEY: Record<string, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '20:00',
  snack: '16:00',
};

const FALLBACK_TIME = '12:00';

export const defaultTimeForMealType = (option?: BudgetPlanMealTypeOption): string =>
  (option && DEFAULT_TIME_BY_KEY[option.key]) ?? FALLBACK_TIME;

/**
 * Builds slots aligned to the current meal-type selection, preserving any time
 * the user already set and giving new meal types a sensible default.
 */
export const buildSlotsForMealTypes = (
  current: NotificationSlotInput[],
  selectedMealTypeIds: string[],
  mealTypeOptions: BudgetPlanMealTypeOption[],
): NotificationSlotInput[] => {
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

/** True when two slot arrays match in order, id, time, and enabled. */
export const areSlotsEqual = (a: NotificationSlotInput[], b: NotificationSlotInput[]): boolean =>
  a.length === b.length &&
  a.every(
    (slot, i) =>
      slot.mealTypeId === b[i]?.mealTypeId &&
      slot.time === b[i]?.time &&
      slot.enabled === b[i]?.enabled,
  );
