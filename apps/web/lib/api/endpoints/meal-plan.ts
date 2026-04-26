import { apiClient } from '@/lib/api/client';
import type {
  GetSuggestionsQuery,
  GetSuggestionsResponse,
  GenerateMealPlanResponse,
} from '@repo/shared';

export const mealPlanApi = {
  getSuggestions: (query: GetSuggestionsQuery) =>
    apiClient
      .get('api/meal-plans/suggestions', { searchParams: query })
      .json<GetSuggestionsResponse>(),

  generate: (planId: string) =>
    apiClient
      .post(`api/budget-plans/${planId}/meal-plan/generate`)
      .json<GenerateMealPlanResponse>(),
};
