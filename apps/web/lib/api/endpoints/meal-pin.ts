import { apiClient } from '@/lib/api/client';
import type {
  CreateMealPinInput,
  ListMealPinsQuery,
  ListMealPinsResponse,
  MealPinResponse,
} from '@repo/shared';

export const mealPinApi = {
  list: (planId: string, query: Partial<ListMealPinsQuery> = {}) =>
    apiClient
      .get(`api/budget-plans/${planId}/meal-pins`, {
        searchParams: Object.fromEntries(
          Object.entries(query).filter(([, v]) => v != null && v !== ''),
        ) as Record<string, string>,
      })
      .json<ListMealPinsResponse>(),

  create: (planId: string, input: CreateMealPinInput) =>
    apiClient
      .post(`api/budget-plans/${planId}/meal-pins`, { json: input })
      .json<MealPinResponse>(),

  delete: (planId: string, pinId: string) =>
    apiClient.delete(`api/budget-plans/${planId}/meal-pins/${pinId}`).then(() => undefined),
};
