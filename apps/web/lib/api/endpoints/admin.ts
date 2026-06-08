import { apiClient } from '@/lib/api/client';
import type { ListRestaurantsQuery, ListRestaurantsResponse } from '@repo/shared';

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

  deleteRestaurant: async (id: string): Promise<void> => {
    // 204 No Content — don't parse a body.
    await apiClient.delete(`api/admin/restaurants/${id}`);
  },
};
