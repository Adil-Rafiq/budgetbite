import { eq } from 'drizzle-orm';

import { db } from '../db.js';
import { userPreferences, type UserPreferences, type NewUserPreferences } from '../schema/index.js';

export const userPreferencesRepository = {
  async findByUserId(userId: string): Promise<UserPreferences | undefined> {
    const [row] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    return row;
  },

  async upsert(data: NewUserPreferences): Promise<UserPreferences> {
    const [row] = await db
      .insert(userPreferences)
      .values(data)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          dislikedRestaurantIds: data.dislikedRestaurantIds,
          preferredCuisineTags: data.preferredCuisineTags,
          dislikedCuisineTags: data.dislikedCuisineTags,
          dietaryNotes: data.dietaryNotes,
          feedbackSummary: data.feedbackSummary,
          priceSensitivity: data.priceSensitivity,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error('UserPreferences upsert failed');
    return row;
  },
};
