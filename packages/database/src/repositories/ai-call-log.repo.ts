import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import { aiCallLog, type AiCallLog, type NewAiCallLog } from '../schema/index.js';

export interface ListAiCallLogsFilters {
  operation?: AiCallLog['operation'];
  status?: AiCallLog['status'];
  userId?: string;
  generationId?: string;
  limit?: number;
  offset?: number;
}

const buildConditions = (filters: Omit<ListAiCallLogsFilters, 'limit' | 'offset'>) => {
  const conditions = [];
  if (filters.operation) conditions.push(eq(aiCallLog.operation, filters.operation));
  if (filters.status) conditions.push(eq(aiCallLog.status, filters.status));
  if (filters.userId) conditions.push(eq(aiCallLog.userId, filters.userId));
  if (filters.generationId) conditions.push(eq(aiCallLog.generationId, filters.generationId));
  return conditions;
};

export const aiCallLogRepository = {
  async create(entry: NewAiCallLog): Promise<AiCallLog> {
    const [row] = await db.insert(aiCallLog).values(entry).returning();
    if (!row) throw new Error('AI call log insert failed');
    return row;
  },

  async list(filters: ListAiCallLogsFilters = {}): Promise<AiCallLog[]> {
    const { limit = 50, offset = 0 } = filters;
    const conditions = buildConditions(filters);
    const base = db.select().from(aiCallLog);
    return conditions.length > 0
      ? base
          .where(and(...conditions))
          .orderBy(desc(aiCallLog.createdAt))
          .limit(limit)
          .offset(offset)
      : base.orderBy(desc(aiCallLog.createdAt)).limit(limit).offset(offset);
  },

  async count(filters: Omit<ListAiCallLogsFilters, 'limit' | 'offset'> = {}): Promise<number> {
    const conditions = buildConditions(filters);
    const base = db.select({ count: sql<number>`count(*)::int` }).from(aiCallLog);
    const [row] = conditions.length > 0 ? await base.where(and(...conditions)) : await base;
    return row?.count ?? 0;
  },
};
