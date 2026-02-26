import { asc, eq } from 'drizzle-orm';

import { db } from '../db.js';
import { mealTypes, type MealType, type NewMealType } from '../schema/index.js';

export const mealTypeRepository = {
  async listActive(): Promise<MealType[]> {
    return db
      .select()
      .from(mealTypes)
      .where(eq(mealTypes.active, true))
      .orderBy(asc(mealTypes.sortOrder));
  },

  /** List all meal types (including inactive) for admin. */
  async list(): Promise<MealType[]> {
    return db.select().from(mealTypes).orderBy(asc(mealTypes.sortOrder), asc(mealTypes.key));
  },

  async findById(id: string): Promise<MealType | undefined> {
    const [row] = await db.select().from(mealTypes).where(eq(mealTypes.id, id)).limit(1);
    return row;
  },

  async create(data: NewMealType): Promise<MealType> {
    const [row] = await db.insert(mealTypes).values(data).returning();
    if (!row) throw new Error('MealType insert failed');
    return row;
  },

  async update(id: string, data: Partial<NewMealType>): Promise<MealType> {
    const [row] = await db.update(mealTypes).set(data).where(eq(mealTypes.id, id)).returning();
    if (!row) throw new Error('MealType not found');
    return row;
  },

  async delete(id: string): Promise<void> {
    const result = await db
      .delete(mealTypes)
      .where(eq(mealTypes.id, id))
      .returning({ id: mealTypes.id });
    if (result.length === 0) throw new Error('MealType not found');
  },
};
