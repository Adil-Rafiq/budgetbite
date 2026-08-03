import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMealTypeInput, UpdateMealTypeInput } from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const ADMIN_MEAL_TYPES_KEY = ['admin', 'meal-types'] as const;

export const useAdminMealTypes = () =>
  useQuery({
    queryKey: ADMIN_MEAL_TYPES_KEY,
    queryFn: () => adminApi.listMealTypes(),
  });

export const useCreateAdminMealType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMealTypeInput) => adminApi.createMealType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MEAL_TYPES_KEY });
      showToast.success({ title: 'Meal type created' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not create meal type',
        description: getErrorMessage(err),
      });
    },
  });
};

export const useUpdateAdminMealType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMealTypeInput }) =>
      adminApi.updateMealType(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MEAL_TYPES_KEY });
      showToast.success({ title: 'Meal type updated' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not update meal type',
        description: getErrorMessage(err),
      });
    },
  });
};

/**
 * Swap two meal types' positions as one operation.
 *
 * Reordering used to fire two independent `updateMealType` mutations from the
 * click handler. That produced two success toasts for one intent, and — worse
 * — if the second write failed, the first had already landed, leaving two meal
 * types sharing a `sortOrder` and the list order non-deterministic. Sequencing
 * both writes inside one mutation makes the pair atomic from the UI's point of
 * view, and lets the first be put back when the second fails.
 */
export const useSwapAdminMealTypeOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      a,
      b,
    }: {
      a: { id: string; sortOrder: number };
      b: { id: string; sortOrder: number };
    }) => {
      await adminApi.updateMealType(a.id, { sortOrder: b.sortOrder });
      try {
        await adminApi.updateMealType(b.id, { sortOrder: a.sortOrder });
      } catch (err) {
        // Best-effort rollback. If this also fails there is nothing more the
        // client can do, and the invalidation below will show the real state.
        await adminApi.updateMealType(a.id, { sortOrder: a.sortOrder }).catch(() => {});
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MEAL_TYPES_KEY });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MEAL_TYPES_KEY });
      showToast.error({
        title: 'Could not reorder meal types',
        description: getErrorMessage(err),
      });
    },
  });
};

export const useDeleteAdminMealType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMealType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MEAL_TYPES_KEY });
      showToast.success({ title: 'Meal type deleted' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not delete meal type',
        description: getErrorMessage(err),
      });
    },
  });
};
