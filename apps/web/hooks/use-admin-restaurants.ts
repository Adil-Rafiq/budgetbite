import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateRestaurantInput,
  ListRestaurantsQuery,
  UpdateRestaurantInput,
} from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const ADMIN_RESTAURANTS_KEY = ['admin', 'restaurants'] as const;

export const useAdminRestaurants = (query: Partial<ListRestaurantsQuery>) =>
  useQuery({
    queryKey: [...ADMIN_RESTAURANTS_KEY, query] as const,
    queryFn: () => adminApi.listRestaurants(query),
  });

export const useCreateAdminRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRestaurantInput) => adminApi.createRestaurant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RESTAURANTS_KEY });
      showToast.success({ title: 'Restaurant created' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not create restaurant',
        description: getErrorMessage(err),
      });
    },
  });
};

export const useUpdateAdminRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRestaurantInput }) =>
      adminApi.updateRestaurant(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RESTAURANTS_KEY });
      showToast.success({ title: 'Restaurant updated' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not update restaurant',
        description: getErrorMessage(err),
      });
    },
  });
};

export const useDeleteAdminRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RESTAURANTS_KEY });
      showToast.success({ title: 'Restaurant deleted' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not delete restaurant',
        description: getErrorMessage(err),
      });
    },
  });
};

export const useBulkDeleteAdminRestaurants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Sequential so we can report partial progress and don't hammer the API.
    mutationFn: async (ids: string[]) => {
      let deleted = 0;
      for (const id of ids) {
        await adminApi.deleteRestaurant(id);
        deleted += 1;
      }
      return deleted;
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RESTAURANTS_KEY });
      showToast.success({ title: `${deleted} restaurant${deleted === 1 ? '' : 's'} deleted` });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RESTAURANTS_KEY });
      showToast.error({
        title: 'Bulk delete failed',
        description: getErrorMessage(err),
      });
    },
  });
};
