import { apiClient } from '@/lib/api/client';
import type { GetSuggestionsQuery } from '@repo/shared';

export type MealSuggestionOption = {
  id: string;
  optionIndex: number;
  restaurantId: string;
  restaurantName: string | null;
  menuItemId: string;
  menuItemName: string | null;
  description?: string;
  estimatedPrice: number;
  notes?: string;
};

export type MealSlot = {
  mealTypeId: string;
  mealTypeKey: string;
  mealTypeLabel: string;
  options: MealSuggestionOption[];
};

export type GetSuggestionsResponse = {
  date: string;
  slots: MealSlot[];
};

export const mealPlanApi = {
  getSuggestions: (query: GetSuggestionsQuery) =>
    apiClient
      .get('api/meal-plans/suggestions', { searchParams: query })
      .json<GetSuggestionsResponse>(),
};
