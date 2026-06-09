import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Append-only record of admin/service mutations. Entries are immutable, so
// there is no `updatedAt` and no FK on `actorId` (the trail must survive the
// referenced user being deleted). `actorType` is 'user' (a logged-in admin) or
// 'service' (the scraper acting via the API key).
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorType: text('actor_type').notNull(),
    actorId: uuid('actor_id'),
    actorName: text('actor_name'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_log_entity_idx').on(table.entityType, table.createdAt),
    index('audit_log_created_at_idx').on(table.createdAt),
  ],
);
