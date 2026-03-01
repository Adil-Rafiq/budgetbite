import { eq } from 'drizzle-orm';

import { db } from '../db.js';
import { menuItem, type MenuItem, type NewMenuItem } from '../schema/index.js';

export const menuRepository = {
  async findById(id: string): Promise<MenuItem | undefined> {
    const [row] = await db.select().from(menuItem).where(eq(menuItem.id, id)).limit(1);
    return row;
  },

  async findByRestaurantId(restaurantId: string): Promise<MenuItem[]> {
    return db
      .select()
      .from(menuItem)
      .where(eq(menuItem.restaurantId, restaurantId))
      .orderBy(menuItem.name);
  },

  async create(data: NewMenuItem): Promise<MenuItem> {
    const [inserted] = await db.insert(menuItem).values(data).returning();
    if (!inserted) throw new Error('MenuItem insert failed');
    return inserted;
  },

  async createMany(data: NewMenuItem[]): Promise<MenuItem[]> {
    if (data.length === 0) return [];
    const inserted = await db.insert(menuItem).values(data).returning();
    return inserted;
  },

  async update(id: string, data: Partial<NewMenuItem>): Promise<MenuItem> {
    const [updated] = await db.update(menuItem).set(data).where(eq(menuItem.id, id)).returning();
    if (!updated) throw new Error('MenuItem not found');
    return updated;
  },

  async delete(id: string): Promise<void> {
    const deleted = await db
      .delete(menuItem)
      .where(eq(menuItem.id, id))
      .returning({ id: menuItem.id });
    if (deleted.length === 0) throw new Error('MenuItem not found');
  },
};
