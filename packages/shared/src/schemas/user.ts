import { z } from 'zod';

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
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const userWithProfileSchema = userSchema.extend({
  profile: userProfileSchema.nullable().optional(),
});

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const updateUserProfileSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type User = z.infer<typeof userSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserWithProfile = z.infer<typeof userWithProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
