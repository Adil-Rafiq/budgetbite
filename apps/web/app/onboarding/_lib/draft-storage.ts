'use client';

/**
 * Onboarding's slice of the shared budget-form draft store.
 *
 * The mechanism now lives in `@/lib/budget-plan/draft-storage` so the /plans
 * wizard gets the same interruption safety under its own key; this module keeps
 * onboarding's storage key and its existing call sites unchanged.
 */

import {
  clearDraftIn,
  patchDraftIn,
  readDraftFrom,
  type BudgetPlanDraft,
} from '@/lib/budget-plan/draft-storage';

const STORAGE_KEY = 'budgetbite:onboarding-draft:v1';

export type OnboardingDraft = BudgetPlanDraft;

export const readDraft = (): OnboardingDraft => readDraftFrom(STORAGE_KEY);

export const patchDraft = (patch: OnboardingDraft): void => patchDraftIn(STORAGE_KEY, patch);

export const clearDraft = (): void => clearDraftIn(STORAGE_KEY);
