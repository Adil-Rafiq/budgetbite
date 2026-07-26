'use client';

/**
 * Session-scoped draft for the parts of onboarding that are not persisted
 * server-side until the very last click.
 *
 * Location and dietary preferences hit the profile endpoint on Continue, but
 * the budget and reminder values only leave the browser at Launch. Without
 * this, a phone reclaiming the tab mid-budget — the single most common mobile
 * onboarding interruption — silently discarded everything the user had typed.
 *
 * sessionStorage, not localStorage: a draft should not outlive the browsing
 * session or leak into a different account on a shared device. Every read is
 * defensive; a malformed or partially-written entry is discarded rather than
 * being allowed to poison the form.
 */

const STORAGE_KEY = 'budgetbite:onboarding-draft:v1';

export interface OnboardingDraft {
  planType?: 'weekly' | 'monthly';
  totalBudget?: number;
  mealTypeIds?: string[];
  notificationSlots?: { mealTypeId: string; time: string; enabled: boolean }[];
}

const isBrowser = () => typeof window !== 'undefined';

export function readDraft(): OnboardingDraft {
  if (!isBrowser()) return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const draft = parsed as Record<string, unknown>;
    const out: OnboardingDraft = {};

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

export function patchDraft(patch: OnboardingDraft): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readDraft(), ...patch }));
  } catch {
    // Private-mode or quota failures are not worth interrupting setup over.
  }
}

export function clearDraft(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — nothing the user can act on.
  }
}
