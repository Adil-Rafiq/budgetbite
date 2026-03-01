import { eq } from 'drizzle-orm';

import { db } from '../db.js';
import { userProfile, type UserProfile, type UpdateUserProfile } from '../schema/index.js';

export const userProfileRepository = {
  async findByUserId(userId: string): Promise<UserProfile | undefined> {
    const [row] = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);
    return row;
  },

  async create(profile: UserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfile).values(profile).returning();
    if (!created) throw new Error('Failed to create user profile');
    return created;
  },

  async update(userId: string, updates: UpdateUserProfile): Promise<UserProfile> {
    const [updated] = await db
      .update(userProfile)
      .set(updates)
      .where(eq(userProfile.userId, userId))
      .returning();
    if (!updated) throw new Error('User profile not found');
    return updated;
  },
};
