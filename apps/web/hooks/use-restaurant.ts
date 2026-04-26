import { useQuery } from '@tanstack/react-query';
import type { ListRestaurantsQuery } from '@repo/shared';

import { restaurantApi } from '@/lib/api/endpoints/restaurant';

export const useRestaurants = (query: Partial<ListRestaurantsQuery>) =>
  useQuery({
    queryKey: ['restaurants', query] as const,
    queryFn: () => restaurantApi.list(query),
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
