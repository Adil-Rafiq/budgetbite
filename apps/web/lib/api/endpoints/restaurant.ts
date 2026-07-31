import { apiClient } from '@/lib/api/client';
import type {
  ListMenuQuery,
  ListMenuResponse,
  ListRestaurantsQuery,
  ListRestaurantsResponse,
  MenuFacets,
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

  /** One page of a menu. Search, sort, category and price ceiling run server-side. */
  getMenu: (id: string, query: Partial<ListMenuQuery>) =>
    apiClient
      .get(`api/restaurants/${id}/menu`, { searchParams: stripUndefined(query) })
      .json<ListMenuResponse>(),

  getMenuFacets: (id: string) =>
    apiClient.get(`api/restaurants/${id}/menu/facets`).json<MenuFacets>(),
};
