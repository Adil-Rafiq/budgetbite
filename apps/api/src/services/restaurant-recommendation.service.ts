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
    area: rec.area,
    note: rec.note,
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
      area: input.area ?? null,
      note: input.note ?? null,
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

    const updated = await restaurantRecommendationRepository.update(id, {
      status: input.status,
      adminNote: input.adminNote ?? null,
      createdRestaurantId: input.createdRestaurantId ?? null,
      reviewedAt: new Date(),
    });

    await auditService.record({
      actor,
      action: `restaurant-recommendation.${input.status}`,
      entityType: 'restaurant-recommendation',
      entityId: id,
      metadata: {
        name: existing.name,
        ...(input.createdRestaurantId && { createdRestaurantId: input.createdRestaurantId }),
      },
    });

    return toResponse(updated);
  },
};
