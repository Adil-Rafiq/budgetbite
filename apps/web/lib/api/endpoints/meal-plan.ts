import { apiClient } from '@/lib/api/client';
import type {
  GetSuggestionsQuery,
  GetSuggestionsResponse,
  GenerateMealPlanResponse,
  RerollSlotInput,
  RerollSlotResponse,
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

  // Synchronous: the LLM call runs within the request, so the timeout is
  // raised well past ky's 10s default to cover retries on slow generations.
  rerollSlot: (planId: string, input: RerollSlotInput) =>
    apiClient
      .post(`api/budget-plans/${planId}/meal-plan/reroll-slot`, {
        json: input,
        timeout: 120_000,
      })
      .json<RerollSlotResponse>(),
};
