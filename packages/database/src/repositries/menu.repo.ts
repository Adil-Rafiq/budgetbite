import { eq } from "drizzle-orm";

import { db } from "../db.js";
import { menuItems, type MenuItem, type NewMenuItem } from "../schema";

export const menuRepository = {
  async findById(id: string): Promise<MenuItem | undefined> {
    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    return row;
  },

  async findByRestaurantId(restaurantId: string): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId)).orderBy(menuItems.name);
  },

  async create(data: NewMenuItem): Promise<MenuItem> {
    const [inserted] = await db.insert(menuItems).values(data).returning();
    if (!inserted) throw new Error("MenuItem insert failed");
    return inserted;
  },

  async createMany(data: NewMenuItem[]): Promise<MenuItem[]> {
    if (data.length === 0) return [];
    const inserted = await db.insert(menuItems).values(data).returning();
    return inserted;
  },

  async update(id: string, data: Partial<NewMenuItem>): Promise<MenuItem> {
    const [updated] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
    if (!updated) throw new Error("MenuItem not found");
    return updated;
  },
};
