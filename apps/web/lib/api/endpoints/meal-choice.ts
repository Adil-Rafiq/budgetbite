import { apiClient } from '@/lib/api/client';
import type {
  MealChoiceResponse,
  Paginated,
  PaginationQuery,
  RecordMealChoiceInput,
} from '@repo/shared';

export const mealChoiceApi = {
  record: (planId: string, input: RecordMealChoiceInput) =>
    apiClient
      .post(`api/budget-plans/${planId}/choices`, { json: input })
      .json<MealChoiceResponse>(),

  listByPlan: (planId: string, params: Partial<PaginationQuery>) =>
    apiClient
      .get(`api/budget-plans/${planId}/choices`, { searchParams: params })
      .json<Paginated<MealChoiceResponse>>(),
};
