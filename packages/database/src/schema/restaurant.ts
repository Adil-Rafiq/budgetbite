import { decimal, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { timestamps } from './common/timestamps.js';

export const restaurant = pgTable(
  'restaurant',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Foodpanda vendor id for scraped rows; NULL for generic/community restaurants
    // (e.g. user-recommended local spots that aren't on Foodpanda).
    externalId: text('external_id'),
    // 'foodpanda' (scraped) | 'community' (user-recommended / manually added).
    source: text('source').notNull().default('foodpanda'),
    name: text('name').notNull(),
    slug: text('slug'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
    minimumOrder: decimal('minimum_order', { precision: 10, scale: 2 }),
    rating: decimal('rating', { precision: 3, scale: 2 }),
    ratingCount: integer('rating_count').notNull().default(0),

    ...timestamps,
  },
  (table) => [
    // Unique only among rows that actually have an externalId — many community
    // rows can share NULL (Postgres treats NULLs as distinct, but the partial
    // predicate makes the intent explicit and keeps the scraper's dedup intact).
    uniqueIndex('restaurant_external_id_unique')
      .on(table.externalId)
      .where(sql`${table.externalId} is not null`),
  ],
);
