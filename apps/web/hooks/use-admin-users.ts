import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListUsersQuery, UpdateUserRoleInput } from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';
import { getErrorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

const ADMIN_USERS_KEY = ['admin', 'users'] as const;

export const useAdminUsers = (query: Partial<ListUsersQuery>) =>
  useQuery({
    queryKey: [...ADMIN_USERS_KEY, query] as const,
    queryFn: () => adminApi.listUsers(query),
  });

export const useUpdateAdminUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserRoleInput }) =>
      adminApi.updateUserRole(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      showToast.success({ title: 'Role updated' });
    },
    onError: (err) => {
      showToast.error({
        title: 'Could not update role',
        description: getErrorMessage(err),
      });
    },
  });
};
