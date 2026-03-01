import { integer, decimal, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './common/timestamps.js';

export const restaurant = pgTable('restaurant', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
  minimumOrder: decimal('minimum_order', { precision: 10, scale: 2 }),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  ratingCount: integer('rating_count').notNull().default(0),

  ...timestamps,
});
