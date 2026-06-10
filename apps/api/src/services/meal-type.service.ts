import type { CreateMealTypeInput, MealType, UpdateMealTypeInput } from '@repo/shared';
import { mealTypeRepository } from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';
import { auditService } from './audit.service.js';
import type { AuditActor } from '../lib/audit-actor.js';

export const mealTypeService = {
  /** Public list — only active types, sorted by sortOrder. */
  async listActive(): Promise<MealType[]> {
    return mealTypeRepository.listActive();
  },

  /** Admin list — includes inactive. */
  async listAll(): Promise<MealType[]> {
    return mealTypeRepository.list();
  },

  async create(input: CreateMealTypeInput, actor: AuditActor): Promise<MealType> {
    const created = await mealTypeRepository.create({
      key: input.key,
      label: input.label,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    });
    await auditService.record({
      actor,
      action: 'meal-type.create',
      entityType: 'meal-type',
      entityId: created.id,
      metadata: { key: created.key, label: created.label },
    });
    return created;
  },

  async update(id: string, input: UpdateMealTypeInput, actor: AuditActor): Promise<MealType> {
    const existing = await mealTypeRepository.findById(id);
    if (!existing) throw new AppError(404, 'Meal type not found', 'NOT_FOUND');
    const updated = await mealTypeRepository.update(id, input);
    await auditService.record({
      actor,
      action: 'meal-type.update',
      entityType: 'meal-type',
      entityId: id,
      metadata: { key: updated.key, label: updated.label },
    });
    return updated;
  },

  async delete(id: string, actor: AuditActor): Promise<void> {
    const existing = await mealTypeRepository.findById(id);
    if (!existing) throw new AppError(404, 'Meal type not found', 'NOT_FOUND');
    await mealTypeRepository.delete(id);
    await auditService.record({
      actor,
      action: 'meal-type.delete',
      entityType: 'meal-type',
      entityId: id,
      metadata: { key: existing.key, label: existing.label },
    });
  },
};
