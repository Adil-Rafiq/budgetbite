import type { CreateMealPinInput, ListMealPinsQuery, MealPinResponse } from '@repo/shared';
import { toNumber } from '@repo/shared';
import {
  budgetPlanRepository,
  mealPinRepository,
  type MealPinWithRefs,
} from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function toResponse(row: MealPinWithRefs): MealPinResponse {
  return {
    id: row.id,
    budgetPlanId: row.budgetPlanId,
    slotDate: row.slotDate,
    mealTypeId: row.mealTypeId,
    restaurantId: row.restaurantId,
    restaurantName: row.restaurant.name,
    menuItemId: row.menuItemId,
    menuItemName: row.menuItem.name,
    menuItemDescription: row.menuItem.description,
    menuItemImageUrl: row.menuItem.imageUrl,
    priceAtPin: toNumber(row.priceAtPin),
    createdAt: row.createdAt,
  };
}

async function loadOwnedActive(userId: string, budgetPlanId: string) {
  const plan = await budgetPlanRepository.findById(budgetPlanId);
  if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
  if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  if (plan.status !== 'active') {
    throw new AppError(400, 'Plan is not active', 'PLAN_NOT_ACTIVE');
  }
  return plan;
}

export const mealPinService = {
  /**
   * Upsert a pin for a (planId, slotDate, mealTypeId) triplet. The slot is
   * rejected when slotDate is strictly before today — pins are a forward-
   * looking commitment; same-day-but-earlier-meal cases (e.g. user pins
   * breakfast at 2 PM) are intentionally allowed because logging that as a
   * choice instead is the user's call.
   *
   * priceAtPin is snapshotted server-side from menuItem.price; the client
   * never gets to set it.
   */
  async upsertPin(
    userId: string,
    budgetPlanId: string,
    input: CreateMealPinInput,
  ): Promise<MealPinResponse> {
    await loadOwnedActive(userId, budgetPlanId);

    if (input.slotDate < todayDateString()) {
      throw new AppError(
        400,
        'Pin slotDate must be today or in the future',
        'PIN_SLOT_IN_PAST',
      );
    }

    const menu = await mealPinRepository.getCurrentMenuItemPrice(input.menuItemId);
    if (!menu) {
      throw new AppError(404, 'Menu item not found', 'NOT_FOUND');
    }
    if (menu.restaurantId !== input.restaurantId) {
      throw new AppError(
        400,
        'Menu item does not belong to the supplied restaurant',
        'MENU_ITEM_RESTAURANT_MISMATCH',
      );
    }

    await mealPinRepository.upsert({
      userId,
      budgetPlanId,
      slotDate: input.slotDate,
      mealTypeId: input.mealTypeId,
      restaurantId: input.restaurantId,
      menuItemId: input.menuItemId,
      priceAtPin: menu.price,
    });

    // Re-read with relations so the response carries names / image / description.
    const [pin] = await mealPinRepository.listByPlan(budgetPlanId, {
      slotDate: input.slotDate,
    });
    if (!pin) {
      throw new AppError(500, 'Pin upserted but could not be reloaded', 'INTERNAL_ERROR');
    }
    return toResponse(pin);
  },

  async deletePin(userId: string, pinId: string): Promise<void> {
    const existing = await mealPinRepository.findById(pinId);
    if (!existing) throw new AppError(404, 'Pin not found', 'NOT_FOUND');
    if (existing.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    await mealPinRepository.delete(pinId);
  },

  async listByPlan(
    userId: string,
    budgetPlanId: string,
    query: ListMealPinsQuery,
  ): Promise<MealPinResponse[]> {
    await loadOwnedActive(userId, budgetPlanId);
    const rows = await mealPinRepository.listByPlan(budgetPlanId, {
      slotDate: query.slotDate,
      // Default: when no explicit range, list pins from today onward — historical
      // pins are not actionable (the slot is already past).
      fromDate: query.slotDate ? undefined : (query.fromDate ?? todayDateString()),
    });
    return rows.map(toResponse);
  },
};
