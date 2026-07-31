import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListRestaurantsQuery } from '@repo/shared';

import { restaurantApi } from '@/lib/api/endpoints/restaurant';

/**
 * Every filter control on the restaurants page writes a new query key — each
 * debounced keystroke, each chip, each step of a 1–30 distance slider. Without
 * `keepPreviousData` all of those enter `pending`, so `isLoading` flips true
 * and the whole grid is replaced by skeletons: dragging the slider strobes the
 * results and throws away the reader's scroll position and whatever card they
 * were part-way through. Holding the last page means `isFetching` becomes the
 * signal instead, which is what the page's "· updating…" affordance is for.
 */
export const useRestaurants = (query: Partial<ListRestaurantsQuery>) =>
  useQuery({
    queryKey: ['restaurants', query] as const,
    queryFn: () => restaurantApi.list(query),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export const useRestaurant = (id: string) =>
  useQuery({
    queryKey: ['restaurant', id] as const,
    queryFn: () => restaurantApi.getById(id),
    enabled: !!id,
  });

export const useRestaurantMenu = (id: string) =>
  useQuery({
    queryKey: ['restaurantMenu', id] as const,
    queryFn: () => restaurantApi.getMenu(id),
    enabled: !!id,
  });
