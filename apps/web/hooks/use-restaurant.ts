import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ListMenuQuery, ListRestaurantsQuery } from '@repo/shared';

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

/** How many menu items one "Show more" adds — and one page request costs. */
export const MENU_PAGE_SIZE = 24;

/**
 * A menu, one page at a time.
 *
 * The whole menu used to arrive in a single response — 365 items with their
 * descriptions and image URLs — so that the browser could filter and sort them.
 * The server does that now, which means "Show 24 more" fetches 24 more instead
 * of merely revealing rows already paid for.
 *
 * `filters` deliberately excludes `limit`/`offset`: they belong to the page
 * cursor, not the query identity, and putting them in the key would give every
 * page its own cache entry rather than extending one list.
 */
export const useRestaurantMenu = (id: string, filters: Omit<Partial<ListMenuQuery>, 'offset'>) =>
  useInfiniteQuery({
    queryKey: ['restaurantMenu', id, filters] as const,
    queryFn: ({ pageParam }) =>
      restaurantApi.getMenu(id, { ...filters, limit: MENU_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.meta.offset + lastPage.meta.limit;
      return next < lastPage.meta.total ? next : undefined;
    },
    // Changing a filter re-keys the query; without this the list is replaced by
    // skeletons on every keystroke, which is the strobing the grid already had.
    placeholderData: keepPreviousData,
    enabled: !!id,
  });

/**
 * Menu-wide totals and the section list.
 *
 * Its own query because it must not change when the page filters do — it is
 * what "12 of 365" compares against, and what the category chips are drawn
 * from. One request per restaurant, reused across every filter change.
 */
export const useRestaurantMenuFacets = (id: string) =>
  useQuery({
    queryKey: ['restaurantMenuFacets', id] as const,
    queryFn: () => restaurantApi.getMenuFacets(id),
    staleTime: 5 * 60_000,
    enabled: !!id,
  });
