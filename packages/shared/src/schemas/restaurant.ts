import { z } from 'zod';

import { paginationSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const listRestaurantsSchema = paginationSchema.extend({
  maxDistanceKm: z.coerce.number().min(0).max(100).optional(),
  userLat: z.coerce.number().min(-90).max(90).optional(),
  userLng: z.coerce.number().min(-180).max(180).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

export const createRestaurantSchema = z.object({
  externalId: z.string().min(1).max(200),
  name: z.string().min(1).max(300),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  deliveryFee: z.coerce.number().min(0).optional(),
  minimumOrder: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  ratingCount: z.coerce.number().int().min(0).optional(),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const adminGetRestaurantByExternalIdSchema = z.object({
  externalId: z.string().min(1).max(200),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const restaurantSchema = z.object({
  id: uuidSchema,
  externalId: z.string().min(1).max(200),
  name: z.string().min(1).max(300),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  deliveryFee: z.number().min(0).nullable(),
  minimumOrder: z.number().min(0).nullable(),
  rating: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int().min(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const restaurantWithDistanceSchema = restaurantSchema.extend({
  distanceKm: z.number().min(0).optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type ListRestaurantsQuery = z.infer<typeof listRestaurantsSchema>;
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type Restaurant = z.infer<typeof restaurantSchema>;
export type RestaurantWithDistance = z.infer<typeof restaurantWithDistanceSchema>;
