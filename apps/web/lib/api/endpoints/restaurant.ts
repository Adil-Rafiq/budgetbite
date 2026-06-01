import { apiClient } from '@/lib/api/client';
import type {
  ListRestaurantsQuery,
  ListRestaurantsResponse,
  MenuItem,
  Restaurant,
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

export const restaurantApi = {
  list: (query: Partial<ListRestaurantsQuery>) =>
    apiClient
      .get('api/restaurants', { searchParams: stripUndefined(query) })
      .json<ListRestaurantsResponse>(),

  getById: (id: string) => apiClient.get(`api/restaurants/${id}`).json<Restaurant>(),

  getMenu: (id: string) => apiClient.get(`api/restaurants/${id}/menu`).json<MenuItem[]>(),
};
