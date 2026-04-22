import type { CreateMealTypeInput, MealType, UpdateMealTypeInput } from '@repo/shared';
import { mealTypeRepository } from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';

export const mealTypeService = {
  /** Public list — only active types, sorted by sortOrder. */
  async listActive(): Promise<MealType[]> {
    return mealTypeRepository.listActive();
  },

  /** Admin list — includes inactive. */
  async listAll(): Promise<MealType[]> {
    return mealTypeRepository.list();
  },

  async create(input: CreateMealTypeInput): Promise<MealType> {
    return mealTypeRepository.create({
      key: input.key,
      label: input.label,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    });
  },

  async update(id: string, input: UpdateMealTypeInput): Promise<MealType> {
    const existing = await mealTypeRepository.findById(id);
    if (!existing) throw new AppError(404, 'Meal type not found', 'NOT_FOUND');
    return mealTypeRepository.update(id, input);
  },

  async delete(id: string): Promise<void> {
    const existing = await mealTypeRepository.findById(id);
    if (!existing) throw new AppError(404, 'Meal type not found', 'NOT_FOUND');
    await mealTypeRepository.delete(id);
  },
};
