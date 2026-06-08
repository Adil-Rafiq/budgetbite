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
