import { userApi } from '@/lib/api/user.api';
import { UpdateUserProfileInput } from '@repo/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useUser = () => {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: userApi.get,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserProfileInput) => userApi.updateProfile(input),
    onSuccess: () => {
      // invalidate so dashboard re-fetches
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
};
