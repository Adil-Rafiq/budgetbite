import { decimal, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// One row per scraper invocation. The scraper opens a run (status 'running')
// before uploading and closes it ('succeeded' | 'failed') with the totals it
// upserted, giving admins ingestion history without reading scraper logs.
export const scraperRun = pgTable(
  'scraper_run',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').notNull().default('foodpanda'),
    status: text('status').notNull().default('running'),
    area: text('area'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    restaurantsUpserted: integer('restaurants_upserted').notNull().default(0),
    itemsUpserted: integer('items_upserted').notNull().default(0),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [index('scraper_run_started_at_idx').on(table.startedAt)],
);
