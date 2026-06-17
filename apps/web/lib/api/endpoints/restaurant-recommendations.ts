import { apiClient } from '@/lib/api/client';
import type {
  CreateRestaurantRecommendationInput,
  ListRestaurantRecommendationsQuery,
  RestaurantRecommendation,
  RestaurantRecommendationListResponse,
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

export const restaurantRecommendationApi = {
  submit: (input: CreateRestaurantRecommendationInput) =>
    apiClient
      .post('api/restaurant-recommendations', { json: input })
      .json<RestaurantRecommendation>(),

  listMine: (query: Partial<ListRestaurantRecommendationsQuery> = {}) =>
    apiClient
      .get('api/restaurant-recommendations', { searchParams: stripUndefined(query) })
      .json<RestaurantRecommendationListResponse>(),
};
