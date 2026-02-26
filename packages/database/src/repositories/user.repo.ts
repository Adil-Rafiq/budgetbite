import { eq } from 'drizzle-orm';

import { db } from '../db.js';
import { users, type NewUser, type User } from '../schema/index.js';

export const userRepository = {
  async findById(id: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row;
  },

  async create(data: NewUser): Promise<User> {
    const [inserted] = await db.insert(users).values(data).returning();
    if (!inserted) throw new Error('User insert failed');
    return inserted;
  },

  async update(id: string, data: Partial<NewUser>): Promise<User> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    if (!updated) throw new Error('User not found');
    return updated;
  },
};
