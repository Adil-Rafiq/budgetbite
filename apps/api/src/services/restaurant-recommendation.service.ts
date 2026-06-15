import type {
  CreateRestaurantRecommendationInput,
  ListRestaurantRecommendationsQuery,
  RecommendationStatus,
  ReviewRestaurantRecommendationInput,
} from '@repo/shared';
import { MAX_PENDING_RESTAURANT_RECOMMENDATIONS } from '@repo/shared';
import {
  restaurantRecommendationRepository,
  userRepository,
  type AdminRecommendationRow,
  type RestaurantRecommendation,
} from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';
import { auditService } from './audit.service.js';
import type { AuditActor } from '../lib/audit-actor.js';

function toResponse(rec: RestaurantRecommendation) {
  return {
    id: rec.id,
    name: rec.name,
    link: rec.link,
    phone: rec.phone,
    area: rec.area,
    note: rec.note,
    items: (rec.items ?? []).map((i) => ({
      name: i.name,
      price: i.price,
      description: i.description ?? null,
    })),
    latitude: rec.latitude != null ? Number(rec.latitude) : null,
    longitude: rec.longitude != null ? Number(rec.longitude) : null,
    status: rec.status as RecommendationStatus,
    adminNote: rec.adminNote,
    createdRestaurantId: rec.createdRestaurantId,
    reviewedAt: rec.reviewedAt,
    createdAt: rec.createdAt,
  };
}

function toAdminResponse(row: AdminRecommendationRow) {
  return { ...toResponse(row), user: row.user };
}

/** Collapse duplicate item names (menu_item is unique per restaurant+name). */
function dedupeItems(
  items: { name: string; price: number; description?: string | null }[],
): { name: string; price: number; description: string | null }[] {
  const map = new Map<string, { name: string; price: number; description: string | null }>();
  for (const i of items) {
    map.set(i.name.trim().toLowerCase(), {
      name: i.name.trim(),
      price: i.price,
      description: i.description ?? null,
    });
  }
  return Array.from(map.values());
}

export const restaurantRecommendationService = {
  async submit(userId: string, input: CreateRestaurantRecommendationInput) {
    const pending = await restaurantRecommendationRepository.countPendingByUser(userId);
    if (pending >= MAX_PENDING_RESTAURANT_RECOMMENDATIONS) {
      throw new AppError(
        409,
        `You can have at most ${MAX_PENDING_RESTAURANT_RECOMMENDATIONS} recommendations awaiting review. Please wait for an admin to review your existing ones.`,
        'RECOMMENDATION_LIMIT',
      );
    }

    // Capture the user's saved location as a starting point for the admin (the
    // restaurant they're recommending is presumably near them). Best-effort:
    // the user may not have a location set.
    const profile = await userRepository.findProfileByUserId(userId);

    const rec = await restaurantRecommendationRepository.create({
      userId,
      name: input.name,
      link: input.link ?? null,
      phone: input.phone ?? null,
      area: input.area ?? null,
      note: input.note ?? null,
      items: input.items.map((i) => ({
        name: i.name,
        price: i.price,
        description: i.description ?? null,
      })),
      latitude: profile?.latitude != null ? String(profile.latitude) : null,
      longitude: profile?.longitude != null ? String(profile.longitude) : null,
    });
    return toResponse(rec);
  },

  async listMine(userId: string, query: ListRestaurantRecommendationsQuery) {
    const [rows, total] = await Promise.all([
      restaurantRecommendationRepository.listByUser(userId, {
        limit: query.limit,
        offset: query.offset,
      }),
      restaurantRecommendationRepository.countByUser(userId),
    ]);
    return {
      data: rows.map(toResponse),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  },

  async list(query: ListRestaurantRecommendationsQuery) {
    const [rows, total] = await Promise.all([
      restaurantRecommendationRepository.listForAdmin({
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      }),
      restaurantRecommendationRepository.countForAdmin(query.status),
    ]);
    return {
      data: rows.map(toAdminResponse),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  },

  async review(id: string, input: ReviewRestaurantRecommendationInput, actor: AuditActor) {
    const existing = await restaurantRecommendationRepository.findById(id);
    if (!existing) throw new AppError(404, 'Recommendation not found', 'NOT_FOUND');
    if (existing.status !== 'pending') {
      throw new AppError(409, 'This recommendation has already been reviewed', 'ALREADY_REVIEWED');
    }

    if (input.status === 'rejected') {
      const updated = await restaurantRecommendationRepository.update(id, {
        status: 'rejected',
        adminNote: input.adminNote ?? null,
        reviewedAt: new Date(),
      });
      await auditService.record({
        actor,
        action: 'restaurant-recommendation.rejected',
        entityType: 'restaurant-recommendation',
        entityId: id,
        metadata: { name: existing.name },
      });
      return toResponse(updated);
    }

    // Approved: turn it into a real (generic) restaurant + its menu items.
    if (existing.latitude == null || existing.longitude == null) {
      throw new AppError(
        400,
        "This recommendation has no saved location, so a restaurant can't be created automatically. Add the restaurant manually instead.",
        'RECOMMENDATION_NO_LOCATION',
      );
    }

    const items = dedupeItems(existing.items ?? []);
    const { restaurant, recommendation } =
      await restaurantRecommendationRepository.approveWithRestaurant(
        id,
        {
          externalId: null,
          source: 'community',
          name: existing.name,
          slug: null,
          phone: existing.phone,
          orderUrl: existing.link,
          latitude: existing.latitude,
          longitude: existing.longitude,
          deliveryFee: null,
          minimumOrder: null,
          rating: null,
          ratingCount: 0,
        },
        items.map((i) => ({
          name: i.name,
          price: String(i.price),
          description: i.description ?? null,
        })),
      );

    await auditService.record({
      actor,
      action: 'restaurant-recommendation.approved',
      entityType: 'restaurant-recommendation',
      entityId: id,
      metadata: {
        name: existing.name,
        createdRestaurantId: restaurant.id,
        itemCount: items.length,
      },
    });

    return toResponse(recommendation);
  },
};
