import { apiClient } from '@/lib/api/client';
import type {
  CreateRestaurantRecommendationInput,
  ExtractedMenuResponse,
  ExtractMenuFromImageInput,
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

  withdraw: async (id: string): Promise<void> => {
    // 204 No Content — don't parse a body.
    await apiClient.delete(`api/restaurant-recommendations/${id}`);
  },

  listMine: (query: Partial<ListRestaurantRecommendationsQuery> = {}) =>
    apiClient
      .get('api/restaurant-recommendations', { searchParams: stripUndefined(query) })
      .json<RestaurantRecommendationListResponse>(),

  // Multimodal LLM call — comfortably slower than ky's 10s default timeout.
  extractMenu: (input: ExtractMenuFromImageInput) =>
    apiClient
      .post('api/restaurant-recommendations/extract-menu-image', {
        json: input,
        timeout: 90_000,
      })
      .json<ExtractedMenuResponse>(),
};
