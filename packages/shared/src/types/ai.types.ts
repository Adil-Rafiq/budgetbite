/**
 * Shared AI types used across the api and ai packages.
 */

// ─── LLM Provider Abstraction ────────────────────────────────────────────────

export type LLMMessage = { role: 'user'; content: string } | { role: 'assistant'; content: string };

export interface LLMRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  model: string;
  provider: string;
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
  menuItems: {
    menuItemId: string;
    name: string;
    description: string | null;
    price: number;
  }[];
}

export interface UserPreferencesContext {
  dislikedRestaurantIds: string[];
  preferredCuisineTags: string[];
  dislikedCuisineTags: string[];
  dietaryNotes: string[];
  feedbackSummary: string | null;
  priceSensitivity: 'budget' | 'mid' | 'premium';
}

export interface BudgetStateContext {
  totalBudget: number;
  amountSpent: number;
  amountRemaining: number;
  totalMeals: number;
  mealsConsumed: number;
  mealsRemaining: number;
  avgBudgetPerRemainingMeal: number;
  cumulativeVariance: number;
}

export interface PlanMetaContext {
  budgetPlanId: string;
  planType: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  mealTypes: { key: string; label: string; sortOrder: number }[];
}

/** Full context object assembled by ContextBuilderService before every LLM call */
export interface MealPlannerContext {
  plan: PlanMetaContext;
  budget: BudgetStateContext;
  preferences: UserPreferencesContext;
  restaurants: NearbyRestaurantContext[];
  /** ISO date strings for the remaining days that still need suggestions */
  remainingDates: string[];
}

// ─── LLM Output shapes ────────────────────────────────────────────────────────

export interface MealSuggestionOption {
  optionIndex: number; // 0, 1, 2
  restaurantId: string;
  menuItemId: string;
  estimatedPrice: number;
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
  userId: string;
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
