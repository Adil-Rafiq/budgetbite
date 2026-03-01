import { eq } from 'drizzle-orm';

import { db } from '../db.js';
import { user, type UpdateUser, type User } from '../schema/auth.js';

export const userRepository = {
  async findById(id: string): Promise<User | undefined> {
    const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return row;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    return row;
  },

  async update(id: string, data: Partial<UpdateUser>): Promise<User> {
    const [updated] = await db.update(user).set(data).where(eq(user.id, id)).returning();
    if (!updated) throw new Error('User not found');
    return updated;
  },
};
