import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import { auditLog, type AuditLog, type NewAuditLog } from '../schema/index.js';

export interface ListAuditLogsFilters {
  entityType?: string;
  action?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}

const buildConditions = (filters: Omit<ListAuditLogsFilters, 'limit' | 'offset'>) => {
  const conditions = [];
  if (filters.entityType) conditions.push(eq(auditLog.entityType, filters.entityType));
  if (filters.action) conditions.push(eq(auditLog.action, filters.action));
  if (filters.actorId) conditions.push(eq(auditLog.actorId, filters.actorId));
  return conditions;
};

export const auditRepository = {
  async create(entry: NewAuditLog): Promise<AuditLog> {
    const [row] = await db.insert(auditLog).values(entry).returning();
    if (!row) throw new Error('Audit log insert failed');
    return row;
  },

  async list(filters: ListAuditLogsFilters = {}): Promise<AuditLog[]> {
    const { limit = 50, offset = 0 } = filters;
    const conditions = buildConditions(filters);
    const base = db.select().from(auditLog);
    return conditions.length > 0
      ? base
          .where(and(...conditions))
          .orderBy(desc(auditLog.createdAt))
          .limit(limit)
          .offset(offset)
      : base.orderBy(desc(auditLog.createdAt)).limit(limit).offset(offset);
  },

  async count(filters: Omit<ListAuditLogsFilters, 'limit' | 'offset'> = {}): Promise<number> {
    const conditions = buildConditions(filters);
    const base = db.select({ count: sql<number>`count(*)::int` }).from(auditLog);
    const [row] = conditions.length > 0 ? await base.where(and(...conditions)) : await base;
    return row?.count ?? 0;
  },
};
