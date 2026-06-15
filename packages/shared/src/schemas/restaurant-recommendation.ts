import { z } from 'zod';

import { paginatedSchema, paginationSchema, uuidSchema } from './common.js';

/**
 * Most pending recommendations a single user may have awaiting review. Shared so
 * the API enforces it and the web app can show "N / MAX used". Once an admin
 * reviews one (approve/reject), the slot frees up.
 */
export const MAX_PENDING_RESTAURANT_RECOMMENDATIONS = 3;

export const recommendationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

// ─── Inputs ─────────────────────────────────────────────────────────────────

/**
 * What a user submits. Coordinates are NOT taken from the client — the server
 * captures the user's saved profile location at submit time as a hint for the
 * admin (a restaurant needs lat/lng to be created).
 */
export const createRestaurantRecommendationSchema = z.object({
  name: z.string().trim().min(1).max(300),
  link: z.url().max(2000).optional(),
  area: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const listRestaurantRecommendationsQuerySchema = paginationSchema.extend({
  status: recommendationStatusSchema.optional(),
});

/** Admin review action: approve or reject, optionally linking the created restaurant. */
export const reviewRestaurantRecommendationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().trim().max(1000).optional(),
  createdRestaurantId: uuidSchema.optional(),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const restaurantRecommendationSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  link: z.string().nullable(),
  area: z.string().nullable(),
  note: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  status: recommendationStatusSchema,
  adminNote: z.string().nullable(),
  createdRestaurantId: uuidSchema.nullable(),
  reviewedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const restaurantRecommendationListResponseSchema = paginatedSchema(
  restaurantRecommendationSchema,
);

export const recommendationSubmitterSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  email: z.string(),
});

/** Admin view carries the submitting user; user-facing view does not. */
export const adminRestaurantRecommendationSchema = restaurantRecommendationSchema.extend({
  user: recommendationSubmitterSchema,
});

export const adminRestaurantRecommendationListResponseSchema = paginatedSchema(
  adminRestaurantRecommendationSchema,
);

// ─── Types ──────────────────────────────────────────────────────────────────

export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>;
export type CreateRestaurantRecommendationInput = z.infer<
  typeof createRestaurantRecommendationSchema
>;
export type ListRestaurantRecommendationsQuery = z.infer<
  typeof listRestaurantRecommendationsQuerySchema
>;
export type ReviewRestaurantRecommendationInput = z.infer<
  typeof reviewRestaurantRecommendationSchema
>;
export type RestaurantRecommendation = z.infer<typeof restaurantRecommendationSchema>;
export type RestaurantRecommendationListResponse = z.infer<
  typeof restaurantRecommendationListResponseSchema
>;
export type AdminRestaurantRecommendation = z.infer<typeof adminRestaurantRecommendationSchema>;
export type AdminRestaurantRecommendationListResponse = z.infer<
  typeof adminRestaurantRecommendationListResponseSchema
>;
