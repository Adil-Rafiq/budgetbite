import type {
  FoodPreferenceResponse,
  UpsertFoodPreferenceInput,
  DeleteFoodPreferenceInput,
} from '@repo/shared';
import {
  menuRepository,
  restaurantRepository,
  userFoodPreferenceRepository,
  type FoodPreferenceWithRefs,
} from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';

function toResponse(row: FoodPreferenceWithRefs): FoodPreferenceResponse {
  if (row.restaurant) {
    return {
      id: row.id,
      targetType: 'restaurant',
      targetId: row.restaurant.id,
      sentiment: row.sentiment,
      name: row.restaurant.name,
      restaurantId: null,
      restaurantName: null,
      description: null,
      imageUrl: null,
      createdAt: row.createdAt,
    };
  }
  if (row.menuItem) {
    return {
      id: row.id,
      targetType: 'menu_item',
      targetId: row.menuItem.id,
      sentiment: row.sentiment,
      name: row.menuItem.name,
      restaurantId: row.menuItem.restaurant.id,
      restaurantName: row.menuItem.restaurant.name,
      description: row.menuItem.description,
      imageUrl: row.menuItem.imageUrl,
      createdAt: row.createdAt,
    };
  }
  // The check constraint guarantees one target is set; this is unreachable.
  throw new AppError(500, 'Food preference has no target', 'INTERNAL_ERROR');
}

export const foodPreferenceService = {
  async list(userId: string): Promise<FoodPreferenceResponse[]> {
    const rows = await userFoodPreferenceRepository.list(userId);
    return rows.map(toResponse);
  },

  /**
   * Create or flip the sentiment of a preference for a restaurant or dish. The
   * target is validated to exist so we never persist a dangling reference.
   */
  async upsert(userId: string, input: UpsertFoodPreferenceInput): Promise<FoodPreferenceResponse> {
    if (input.targetType === 'restaurant') {
      const restaurant = await restaurantRepository.findById(input.targetId);
      if (!restaurant) throw new AppError(404, 'Restaurant not found', 'NOT_FOUND');
    } else {
      const item = await menuRepository.findById(input.targetId);
      if (!item) throw new AppError(404, 'Menu item not found', 'NOT_FOUND');
    }

    const row = await userFoodPreferenceRepository.upsert({
      userId,
      restaurantId: input.targetType === 'restaurant' ? input.targetId : null,
      menuItemId: input.targetType === 'menu_item' ? input.targetId : null,
      sentiment: input.sentiment,
    });

    const withRefs = await userFoodPreferenceRepository.getWithRefs(row.id);
    if (!withRefs) {
      throw new AppError(500, 'Preference saved but could not be reloaded', 'INTERNAL_ERROR');
    }
    return toResponse(withRefs);
  },

  async remove(userId: string, input: DeleteFoodPreferenceInput): Promise<void> {
    const deleted = await userFoodPreferenceRepository.deleteByTarget(userId, {
      restaurantId: input.targetType === 'restaurant' ? input.targetId : null,
      menuItemId: input.targetType === 'menu_item' ? input.targetId : null,
    });
    if (deleted === 0) throw new AppError(404, 'Preference not found', 'NOT_FOUND');
  },
};
