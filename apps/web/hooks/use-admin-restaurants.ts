import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListRestaurantsQuery } from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const ADMIN_RESTAURANTS_KEY = ['admin', 'restaurants'] as const;

export const useAdminRestaurants = (query: Partial<ListRestaurantsQuery>) =>
  useQuery({
    queryKey: [...ADMIN_RESTAURANTS_KEY, query] as const,
    queryFn: () => adminApi.listRestaurants(query),
  });

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
