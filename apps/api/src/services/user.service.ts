import { userRepository, type UserRole } from '@repo/database';
import { AppError } from '../middleware/error.middleware.js';
import type { ListUsersQuery, UpdateUserProfileInput, UpdateUserRoleInput } from '@repo/shared';

import { auditService } from './audit.service.js';
import type { AuditActor } from '../lib/audit-actor.js';

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
      dietaryPreferences: data.dietaryPreferences,
      allergens: data.allergens,
    });

    return profile;
  },

  // ── Admin ──
  async list(query: ListUsersQuery) {
    const { q, role, limit, offset } = query;
    const [data, total] = await Promise.all([
      userRepository.list({ q, role, limit, offset }),
      userRepository.count({ q, role }),
    ]);
    return { data, meta: { total, limit, offset } };
  },

  async updateRole(id: string, input: UpdateUserRoleInput, actor: AuditActor) {
    const existing = await userRepository.findById(id);
    if (!existing) throw new AppError(404, 'User not found', 'NOT_FOUND');
    // Guard against an admin demoting themselves out of admin access.
    if (actor.actorType === 'user' && actor.actorId === id && input.role !== 'admin') {
      throw new AppError(400, 'You cannot change your own admin role', 'BAD_REQUEST');
    }
    const updated = await userRepository.updateRole(id, input.role as UserRole);
    await auditService.record({
      actor,
      action: 'user.role-change',
      entityType: 'user',
      entityId: id,
      metadata: { email: updated.email, role: updated.role, previousRole: existing.role },
    });
    return updated;
  },
};
