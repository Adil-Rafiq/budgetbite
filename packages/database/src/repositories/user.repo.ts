import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { user } from '../schema/auth.js';
import { userProfile } from '../schema/user-profile.js';
import type { UserProfile, UpdateUserProfile } from '../index.js';

export const userRepository = {
  async findById(id: string) {
    const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return row;
  },

  async findByEmail(email: string) {
    const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    return row;
  },

  async findProfileByUserId(userId: string): Promise<UserProfile | undefined> {
    const [row] = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);
    return row;
  },

  async upsertProfile(userId: string, data: UpdateUserProfile): Promise<UserProfile> {
    const [row] = await db
      .insert(userProfile)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: userProfile.userId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error('User profile upsert failed');
    return row;
  },
};
