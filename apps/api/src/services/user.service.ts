import type { UpdateProfileInput } from "../lib/validation.js";
import { userRepository } from "@budgetbite/database";
import { AppError } from "../middleware/error.middleware.js";

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      latitude: user.latitude != null ? Number(user.latitude) : null,
      longitude: user.longitude != null ? Number(user.longitude) : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    const updated = await userRepository.update(userId, {
      firstName: input.firstName ?? user.firstName,
      lastName: input.lastName ?? user.lastName,
      latitude: input.latitude != null ? String(input.latitude) : user.latitude,
      longitude: input.longitude != null ? String(input.longitude) : user.longitude,
    });
    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      latitude: updated.latitude != null ? Number(updated.latitude) : null,
      longitude: updated.longitude != null ? Number(updated.longitude) : null,
      updatedAt: updated.updatedAt,
    };
  },
};
