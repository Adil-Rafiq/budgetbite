import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMenuItemInput, UpdateMenuItemInput } from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const menuItemsKey = (restaurantId: string) =>
  ['admin', 'restaurants', restaurantId, 'menu-items'] as const;

export const useAdminMenuItems = (restaurantId: string) =>
  useQuery({
    queryKey: menuItemsKey(restaurantId),
    queryFn: () => adminApi.listMenuItems(restaurantId),
    enabled: !!restaurantId,
  });

export const useCreateAdminMenuItem = (restaurantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMenuItemInput) => adminApi.createMenuItem(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuItemsKey(restaurantId) });
      showToast.success({ title: 'Menu item added' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not add menu item',
        description: getErrorMessage(err),
      });
    },
  });
};

export const useUpdateAdminMenuItem = (restaurantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMenuItemInput }) =>
      adminApi.updateMenuItem(restaurantId, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuItemsKey(restaurantId) });
      showToast.success({ title: 'Menu item updated' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not update menu item',
        description: getErrorMessage(err),
      });
    },
  });
};

export const useDeleteAdminMenuItem = (restaurantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => adminApi.deleteMenuItem(restaurantId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuItemsKey(restaurantId) });
      showToast.success({ title: 'Menu item deleted' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not delete menu item',
        description: getErrorMessage(err),
      });
    },
  });
};
