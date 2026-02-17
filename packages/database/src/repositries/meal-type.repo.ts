import { asc, eq } from "drizzle-orm";

import { db } from "../db.js";
import { mealTypes, type MealType } from "../schema";

export const mealTypeRepository = {
  async listActive(): Promise<MealType[]> {
    return db.select().from(mealTypes).where(eq(mealTypes.active, true)).orderBy(asc(mealTypes.sortOrder));
  },

  async findById(id: string): Promise<MealType | undefined> {
    const [row] = await db.select().from(mealTypes).where(eq(mealTypes.id, id)).limit(1);
    return row;
  },
};
