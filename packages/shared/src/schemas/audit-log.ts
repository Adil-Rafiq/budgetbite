import { z } from 'zod';

import { paginatedSchema, paginationSchema, uuidSchema } from './common.js';

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const auditLogSchema = z.object({
  id: uuidSchema,
  actorType: z.enum(['user', 'service']),
  actorId: uuidSchema.nullable(),
  actorName: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.coerce.date(),
});

export const auditLogListResponseSchema = paginatedSchema(auditLogSchema);

// ─── Query ──────────────────────────────────────────────────────────────────

export const listAuditLogsQuerySchema = paginationSchema.extend({
  entityType: z.string().optional(),
  action: z.string().optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
