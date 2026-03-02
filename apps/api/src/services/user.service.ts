import { userRepository } from '@repo/database';
import { AppError } from '../middleware/error.middleware.js';
import type { UpdateUserProfileInput } from '@repo/shared';

export const userService = {
  async getMe(userId: string) {
    const foundUser = await userRepository.findById(userId);
    if (!foundUser) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    const profile = await userRepository.findProfileByUserId(userId);

    return {
      ...foundUser,
      profile: profile ?? null,
    };
  },

  async updateUserProfile(userId: string, data: UpdateUserProfileInput) {
    const foundUser = await userRepository.findById(userId);
    if (!foundUser) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    const profile = await userRepository.upsertProfile(userId, {
      latitude: data.latitude,
      longitude: data.longitude,
    });

    return profile;
  },
};
