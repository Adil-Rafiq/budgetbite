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

/**
 * A bulk delete that stopped part-way.
 *
 * The loop always knew how many rows it had destroyed; the old `onError`
 * threw that number away and reported a bare "Bulk delete failed", leaving the
 * operator unable to say whether 3 or 30 restaurants — and every menu item
 * under them — still existed. On a surface whose entire job is knowing what
 * the data actually is, that was the worst possible failure message.
 */
export class BulkDeleteError extends Error {
  constructor(
    readonly deleted: number,
    readonly total: number,
    readonly failedName: string,
    readonly cause: unknown,
  ) {
    super(`Deleted ${deleted} of ${total}, stopped at ${failedName}`);
    this.name = 'BulkDeleteError';
  }
}

export interface BulkDeleteTarget {
  id: string;
  name: string;
}

export const useBulkDeleteAdminRestaurants = (
  /** Called after each delete so the UI can count up rather than show a spinner. */
  onProgress?: (deleted: number, total: number) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    // Sequential so we can report partial progress and don't hammer the API.
    mutationFn: async (targets: BulkDeleteTarget[]) => {
      let deleted = 0;
      for (const target of targets) {
        try {
          await adminApi.deleteRestaurant(target.id);
        } catch (err) {
          throw new BulkDeleteError(deleted, targets.length, target.name, err);
        }
        deleted += 1;
        onProgress?.(deleted, targets.length);
      }
      return deleted;
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RESTAURANTS_KEY });
      showToast.success({ title: `${deleted} restaurant${deleted === 1 ? '' : 's'} deleted` });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RESTAURANTS_KEY });

      if (err instanceof BulkDeleteError) {
        showToast.error({
          // The count first, because "what is the state of my data" is the
          // question, and the underlying cause is secondary to it.
          title: `Deleted ${err.deleted} of ${err.total} — stopped at ${err.failedName}`,
          description: `${err.deleted === 0 ? 'Nothing was' : `The first ${err.deleted} were`} removed. ${getErrorMessage(err.cause)}`,
        });
        return;
      }

      showToast.error({ title: 'Bulk delete failed', description: getErrorMessage(err) });
    },
  });
};
