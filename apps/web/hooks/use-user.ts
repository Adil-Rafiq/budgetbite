import { userApi } from '@/lib/api/endpoints/user';
import { UpdateUserProfileInput } from '@repo/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useUser = () => {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: userApi.get,
    // The profile page seeds four forms from this query and resets them when it
    // changes. With the default refetch-on-focus, glancing at another app for
    // longer than `staleTime` and coming back wiped every unsaved field on the
    // page. Nothing here changes without this client changing it.
    refetchOnWindowFocus: false,
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
