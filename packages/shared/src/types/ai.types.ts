/**
 * Shared AI types used across the api and ai packages.
 */

import type { BudgetStateContext } from '../schemas/budget-state.js';

// ─── LLM Provider Abstraction ────────────────────────────────────────────────

/** Mime types every supported provider accepts for inline image input. */
export type LLMImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface LLMImageAttachment {
  /** Raw base64 (no `data:` URL prefix). */
  data: string;
  mimeType: LLMImageMimeType;
}

export type LLMMessage =
  | { role: 'user'; content: string; images?: LLMImageAttachment[] }
  | { role: 'assistant'; content: string };

export interface LLMRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  /** Ask the provider for strict JSON output where supported. */
  jsonMode?: boolean;
}

/**
 * Why the provider stopped generating. Normalised across vendors so the
 * caller can react uniformly:
 *  - 'stop'      — natural end of message (good)
 *  - 'length'    — hit max_tokens / max_output_tokens (truncated, JSON likely invalid)
 *  - 'other'     — provider-specific reason (safety filter, tool stop, etc.)
 */
export type LLMFinishReason = 'stop' | 'length' | 'other';

export interface LLMResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  model: string;
  provider: string;
  finishReason: LLMFinishReason;
}

export interface LLMProvider {
  readonly name: string;
  readonly defaultModel: string;
  complete(messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
}

// ─── Context passed to LLM on every call ─────────────────────────────────────

export interface NearbyRestaurantContext {
  restaurantId: string;
  name: string;
  distanceKm: number;
  rating: number | null;
  deliveryFee: number | null;
  /** User has favorited this restaurant — the planner should bias toward it. */
  isFavorite: boolean;
  menuItems: {
    menuItemId: string;
    name: string;
    description: string | null;
    price: number;
    /** User has favorited this dish — the planner should bias toward it. */
    isFavorite: boolean;
  }[];
}

export interface UserPreferencesContext {
  dislikedRestaurantIds: string[];
  preferredCuisineTags: string[];
  dislikedCuisineTags: string[];
  /** AI-inferred dietary notes accumulated from feedback (user_preferences). */
  dietaryNotes: string[];
  /** User-declared dietary preferences from profile/onboarding (user_profile). */
  dietaryPreferences: string[];
  /** User-declared allergens — hard constraints the plan must never violate. */
  allergens: string[];
  feedbackSummary: string | null;
  priceSensitivity: 'budget' | 'mid' | 'premium';
}

export type { BudgetStateContext };

export interface PlanMetaContext {
  budgetPlanId: string;
  planType: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  mealTypes: { id: string; key: string; label: string; sortOrder: number }[];
}

/** Full context object assembled by ContextBuilderService before every LLM call */
export interface MealPlannerContext {
  plan: PlanMetaContext;
  /**
   * Budget state pre-adjusted for any user-pinned future slots: pin count is
   * subtracted from mealsRemaining and pin spend from amountRemaining, then
   * avgBudgetPerRemainingMeal is recomputed. Same shape the FE sees from
   * GET /api/budget-plans/active so the AI and the budget-fit indicator stay
   * in lockstep.
   */
  budget: BudgetStateContext;
  preferences: UserPreferencesContext;
  restaurants: NearbyRestaurantContext[];
  /** ISO date strings for the remaining days that still need suggestions */
  remainingDates: string[];
  /**
   * (slotDate, mealTypeId) pairs the user has already pinned. The LLM must
   * not regenerate these slots — they're rendered to the user from the
   * meal_pin table directly. Empty array when no pins exist.
   */
  pinnedSlots: { slotDate: string; mealTypeId: string }[];
}

// ─── LLM Output shapes ────────────────────────────────────────────────────────

export interface MealSuggestionOptionItem {
  menuItemId: string;
  estimatedPrice: number;
}

/** One option = one order at a single restaurant, composed of 1..N menu items. */
export interface MealSuggestionOption {
  optionIndex: number; // 0, 1, 2
  restaurantId: string;
  items: MealSuggestionOptionItem[];
  notes: string;
}

export interface DayMealSlot {
  slotDate: string; // ISO date string YYYY-MM-DD
  mealTypeKey: string; // e.g. 'breakfast', 'lunch', 'dinner'
  options: MealSuggestionOption[]; // always 3
}

/** What the LLM returns for a full plan generation or re-plan */
export interface GeneratedMealPlan {
  slots: DayMealSlot[];
  planSummary: string; // short human-readable summary the UI can display
  estimatedTotalCost: number;
}

// ─── Service input types ───────────────────────────────────────────────────────

export interface GeneratePlanInput {
  budgetPlanId: string;
  userId: string;
}

export interface ReplanInput {
  budgetPlanId: string;
  userId: string;
  /** The meal choice that triggered the replan */
  triggeringMealChoiceId: string;
}

export interface ProcessFeedbackInput {
  mealChoiceId: string;
  rating: number | null;
  liked: boolean | null;
  comment: string | null;
}

// ─── AI Operation results ─────────────────────────────────────────────────────

export interface AIOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
}
