import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db.js';
import { user } from '../schema/auth.js';
import { userProfile } from '../schema/user-profile.js';
import type { User, UserProfile, UpdateUserProfile } from '../index.js';

export type UserRole = 'user' | 'admin';

export interface ListUsersFilters {
  q?: string;
  role?: UserRole;
  limit?: number;
  offset?: number;
}

const buildUserConditions = (filters: Omit<ListUsersFilters, 'limit' | 'offset'>) => {
  const conditions = [];
  if (filters.role) conditions.push(eq(user.role, filters.role));
  if (filters.q && filters.q.trim().length > 0) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(or(ilike(user.name, term), ilike(user.email, term)));
  }
  return conditions;
};

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

  async list(filters: ListUsersFilters = {}): Promise<User[]> {
    const { limit = 50, offset = 0 } = filters;
    const conditions = buildUserConditions(filters);
    const base = db.select().from(user);
    return conditions.length > 0
      ? base
          .where(and(...conditions))
          .orderBy(desc(user.createdAt))
          .limit(limit)
          .offset(offset)
      : base.orderBy(desc(user.createdAt)).limit(limit).offset(offset);
  },

  async count(filters: Omit<ListUsersFilters, 'limit' | 'offset'> = {}): Promise<number> {
    const conditions = buildUserConditions(filters);
    const base = db.select({ count: sql<number>`count(*)::int` }).from(user);
    const [row] = conditions.length > 0 ? await base.where(and(...conditions)) : await base;
    return row?.count ?? 0;
  },

  async updateRole(id: string, role: UserRole): Promise<User> {
    const [row] = await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();
    if (!row) throw new Error('User not found');
    return row;
  },
};
