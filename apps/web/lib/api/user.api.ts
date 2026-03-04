import { apiClient } from '@/lib/api/client';
import { UpdateUserProfileInput, UserProfile, UserWithProfile } from '@repo/shared';

export const userApi = {
  get: (): Promise<UserWithProfile> => apiClient.get('/api/users/me').json(),
  updateProfile: (input: UpdateUserProfileInput): Promise<UserProfile> =>
    apiClient.patch('/api/users/me/profile', { json: input }).json(),
};
