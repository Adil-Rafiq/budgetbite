import { apiClient } from '@/lib/api/client';
import type {
  CreateMealTypeInput,
  CreateRestaurantInput,
  ListRestaurantsQuery,
  ListRestaurantsResponse,
  MealType,
  Restaurant,
  UpdateMealTypeInput,
  UpdateRestaurantInput,
} from '@repo/shared';

function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) out[k] = v as string | number;
  }
  return out;
}

export const adminApi = {
  listRestaurants: (query: Partial<ListRestaurantsQuery>) =>
    apiClient
      .get('api/admin/restaurants', { searchParams: stripUndefined(query) })
      .json<ListRestaurantsResponse>(),

  createRestaurant: (input: CreateRestaurantInput) =>
    apiClient.post('api/admin/restaurants', { json: input }).json<Restaurant>(),

  updateRestaurant: (id: string, input: UpdateRestaurantInput) =>
    apiClient.patch(`api/admin/restaurants/${id}`, { json: input }).json<Restaurant>(),

  deleteRestaurant: async (id: string): Promise<void> => {
    // 204 No Content — don't parse a body.
    await apiClient.delete(`api/admin/restaurants/${id}`);
  },

  // Admin meal-types list includes inactive rows (unlike the public endpoint).
  listMealTypes: () => apiClient.get('api/admin/meal-types').json<MealType[]>(),

  createMealType: (input: CreateMealTypeInput) =>
    apiClient.post('api/admin/meal-types', { json: input }).json<MealType>(),

  updateMealType: (id: string, input: UpdateMealTypeInput) =>
    apiClient.patch(`api/admin/meal-types/${id}`, { json: input }).json<MealType>(),

  deleteMealType: async (id: string): Promise<void> => {
    // 204 No Content; 409 if a plan still references it.
    await apiClient.delete(`api/admin/meal-types/${id}`);
  },
};
