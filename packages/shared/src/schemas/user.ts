import { z } from 'zod';

import { paginatedSchema, paginationSchema } from './common.js';

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.url().nullable().optional(),
  role: z.enum(['user', 'admin']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const userProfileSchema = z.object({
  userId: z.uuid(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  dietaryPreferences: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const userWithProfileSchema = userSchema.extend({
  profile: userProfileSchema.nullable().optional(),
});

// ─── Inputs ─────────────────────────────────────────────────────────────────

/**
 * Free-form dietary tag list (dietary preferences or allergens).
 * Normalized so the same tag always reaches the DB/prompt in one shape:
 * trimmed, lowercased, empties dropped, de-duplicated.
 */
export const dietaryTagListSchema = z
  .array(z.string().trim().max(60))
  .max(20)
  .transform((tags) => [...new Set(tags.map((t) => t.toLowerCase()).filter((t) => t.length > 0))]);

export const updateUserProfileSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  dietaryPreferences: dietaryTagListSchema.optional(),
  allergens: dietaryTagListSchema.optional(),
});

// ─── Admin ──────────────────────────────────────────────────────────────────

export const listUsersQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const userListResponseSchema = paginatedSchema(userSchema);

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type User = z.infer<typeof userSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserWithProfile = z.infer<typeof userWithProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
