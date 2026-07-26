'use client';

/**
 * Session-scoped draft of an in-progress budget form.
 *
 * Onboarding shipped this because a phone reclaiming the tab mid-budget — the
 * single most common mobile interruption — silently discarded everything the
 * user had typed. The /plans wizard had the same exposure and none of the fix:
 * Esc, an overlay tap, a WhatsApp notification, or a refresh threw away a
 * committed money figure with no confirmation and no restore.
 *
 * sessionStorage, not localStorage: a draft should not outlive the browsing
 * session or leak into a different account on a shared device. Every read is
 * defensive; a malformed or partially-written entry is discarded rather than
 * being allowed to poison the form.
 *
 * Namespaced by key so the two flows never restore each other's numbers.
 */

export interface BudgetPlanDraft {
  planType?: 'weekly' | 'monthly';
  totalBudget?: number;
  mealTypeIds?: string[];
  notificationSlots?: { mealTypeId: string; time: string; enabled: boolean }[];
}

const isBrowser = () => typeof window !== 'undefined';

export function readDraftFrom(storageKey: string): BudgetPlanDraft {
  if (!isBrowser()) return {};
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const draft = parsed as Record<string, unknown>;
    const out: BudgetPlanDraft = {};

    if (draft.planType === 'weekly' || draft.planType === 'monthly') {
      out.planType = draft.planType;
    }
    if (typeof draft.totalBudget === 'number' && Number.isFinite(draft.totalBudget)) {
      out.totalBudget = draft.totalBudget;
    }
    if (Array.isArray(draft.mealTypeIds) && draft.mealTypeIds.every((v) => typeof v === 'string')) {
      out.mealTypeIds = draft.mealTypeIds as string[];
    }
    if (Array.isArray(draft.notificationSlots)) {
      const slots = draft.notificationSlots.filter(
        (slot): slot is { mealTypeId: string; time: string; enabled: boolean } =>
          !!slot &&
          typeof slot === 'object' &&
          typeof (slot as Record<string, unknown>).mealTypeId === 'string' &&
          typeof (slot as Record<string, unknown>).time === 'string' &&
          typeof (slot as Record<string, unknown>).enabled === 'boolean',
      );
      if (slots.length > 0) out.notificationSlots = slots;
    }

    return out;
  } catch {
    return {};
  }
}

export function patchDraftIn(storageKey: string, patch: BudgetPlanDraft): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ ...readDraftFrom(storageKey), ...patch }),
    );
  } catch {
    // Private-mode or quota failures are not worth interrupting setup over.
  }
}

export function clearDraftIn(storageKey: string): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore — nothing the user can act on.
  }
}
