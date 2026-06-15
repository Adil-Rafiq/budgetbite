import { decimal, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from './auth.js';
import { restaurant } from './restaurant.js';

// A user-submitted suggestion for a local restaurant we don't carry yet. Admins
// review the queue and, on approval, create the real restaurant — `created_restaurant_id`
// links the request to the row it produced. The per-user "max N pending" cap is
// enforced in the service, not here, so it can change without a migration.
export const restaurantRecommendation = pgTable(
  'restaurant_recommendation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // Optional Foodpanda (or any) link the user pasted to help the admin find it.
    link: text('link'),
    // Optional area / neighbourhood hint.
    area: text('area'),
    // Optional free-text note ("why add this").
    note: text('note'),
    // The user's saved coordinates at submit time — a starting point for the
    // admin (a restaurant needs lat/lng to be created). Null when the user has
    // no location set; not necessarily the restaurant's exact location.
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    // 'pending' | 'approved' | 'rejected'.
    status: text('status').notNull().default('pending'),
    // Admin's note left when reviewing (e.g. reason for rejection).
    adminNote: text('admin_note'),
    // Set when an approval created (or linked to) a real restaurant row.
    createdRestaurantId: uuid('created_restaurant_id').references(() => restaurant.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('restaurant_recommendation_user_status_idx').on(table.userId, table.status),
    index('restaurant_recommendation_status_created_idx').on(table.status, table.createdAt),
  ],
);
