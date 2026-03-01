import { asc, eq } from 'drizzle-orm';

import { db } from '../db.js';
import { mealType, type MealType, type NewMealType } from '../schema/index.js';

export const mealTypeRepository = {
  async listActive(): Promise<MealType[]> {
    return db
      .select()
      .from(mealType)
      .where(eq(mealType.active, true))
      .orderBy(asc(mealType.sortOrder));
  },

  /** List all meal types (including inactive) for admin. */
  async list(): Promise<MealType[]> {
    return db.select().from(mealType).orderBy(asc(mealType.sortOrder), asc(mealType.key));
  },

  async findById(id: string): Promise<MealType | undefined> {
    const [row] = await db.select().from(mealType).where(eq(mealType.id, id)).limit(1);
    return row;
  },

  async create(data: NewMealType): Promise<MealType> {
    const [row] = await db.insert(mealType).values(data).returning();
    if (!row) throw new Error('MealType insert failed');
    return row;
  },

  async update(id: string, data: Partial<NewMealType>): Promise<MealType> {
    const [row] = await db.update(mealType).set(data).where(eq(mealType.id, id)).returning();
    if (!row) throw new Error('MealType not found');
    return row;
  },

  async delete(id: string): Promise<void> {
    const result = await db
      .delete(mealType)
      .where(eq(mealType.id, id))
      .returning({ id: mealType.id });
    if (result.length === 0) throw new Error('MealType not found');
  },
};
