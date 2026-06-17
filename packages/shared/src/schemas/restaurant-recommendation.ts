import { z } from 'zod';

import { paginatedSchema, paginationSchema, uuidSchema } from './common.js';

/**
 * Most pending recommendations a single user may have awaiting review. Shared so
 * the API enforces it and the web app can show "N / MAX used". Once an admin
 * reviews one (approve/reject), the slot frees up.
 */
export const MAX_PENDING_RESTAURANT_RECOMMENDATIONS = 3;

export const recommendationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

/** Max menu items a user can attach to one recommendation. */
export const MAX_RECOMMENDATION_ITEMS = 30;

// ─── Inputs ─────────────────────────────────────────────────────────────────

/** A single user-supplied menu item on a recommendation. */
export const recommendationItemInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  price: z.coerce.number().positive().max(1_000_000),
  description: z.string().trim().max(500).optional(),
});

/**
 * What a user submits. The submitter pins the restaurant's own location — it is
 * NOT assumed to be the user's location, since a restaurant they want to
 * recommend can be anywhere. The coordinates are required because the restaurant
 * is created at exactly that spot on approval (proximity is what drives plans).
 * Menu items are required because the admin has no other way to know the menu of
 * a local, possibly offline-only restaurant.
 */
export const createRestaurantRecommendationSchema = z.object({
  name: z.string().trim().min(1).max(300),
  link: z.url().max(2000).optional(),
  phone: z.string().trim().min(3).max(30).optional(),
  area: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  items: z.array(recommendationItemInputSchema).min(1).max(MAX_RECOMMENDATION_ITEMS),
});

export const listRestaurantRecommendationsQuerySchema = paginationSchema.extend({
  status: recommendationStatusSchema.optional(),
});

/**
 * Admin review action. Approving auto-creates the restaurant + its menu items
 * server-side (the link is set there), so the client only sends the verdict.
 */
export const reviewRestaurantRecommendationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().trim().max(1000).optional(),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const recommendationItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string().nullable(),
});

export const restaurantRecommendationSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  link: z.string().nullable(),
  phone: z.string().nullable(),
  area: z.string().nullable(),
  note: z.string().nullable(),
  items: z.array(recommendationItemSchema),
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
export type RecommendationItemInput = z.infer<typeof recommendationItemInputSchema>;
export type RecommendationItem = z.infer<typeof recommendationItemSchema>;
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
