import { clearDraftIn } from '@/lib/budget-plan/draft-storage';

/**
 * Storage key for an in-progress create-plan attempt.
 *
 * Namespaced separately from onboarding's so a half-finished plan can never
 * restore itself into first-run setup, or the reverse.
 */
export const PLANS_DRAFT_KEY = 'budgetbite:create-plan-draft:v1';

export const clearPlansDraft = (): void => clearDraftIn(PLANS_DRAFT_KEY);
