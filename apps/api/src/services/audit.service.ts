import { auditRepository, type ListAuditLogsFilters } from '@repo/database';

import type { AuditActor } from '../lib/audit-actor.js';

export interface RecordAuditInput {
  actor: AuditActor;
  /** Dotted action, e.g. `restaurant.create`, `user.role-change`. */
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export const auditService = {
  /**
   * Best-effort write of an audit entry. The mutation it records has already
   * committed by the time this runs, so a logging failure must never surface
   * to the caller — we swallow and log instead of throwing.
   */
  async record(input: RecordAuditInput): Promise<void> {
    try {
      await auditRepository.create({
        actorType: input.actor.actorType,
        actorId: input.actor.actorId,
        actorName: input.actor.actorName,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? null,
      });
    } catch (err) {
      console.error('[audit] failed to record', input.action, err);
    }
  },

  async list(filters: ListAuditLogsFilters) {
    const [data, total] = await Promise.all([
      auditRepository.list(filters),
      auditRepository.count(filters),
    ]);
    return {
      data,
      meta: { total, limit: filters.limit ?? 50, offset: filters.offset ?? 0 },
    };
  },
};
