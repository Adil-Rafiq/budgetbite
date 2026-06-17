import { decimal, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
    // Optional order/menu link the user pasted (becomes the restaurant's orderUrl).
    link: text('link'),
    // Optional contact phone (becomes the restaurant's phone on approval).
    phone: text('phone'),
    // Optional area / neighbourhood hint.
    area: text('area'),
    // Optional free-text note ("why add this").
    note: text('note'),
    // User-submitted menu items: [{ name, price, description? }]. Become real
    // menu_item rows for the created restaurant when an admin approves.
    items: jsonb('items').$type<{ name: string; price: number; description?: string | null }[]>(),
    // The restaurant's location, pinned by the submitter (not their own
    // location — the place can be anywhere). The created restaurant is placed
    // here on approval. Nullable for legacy rows captured before pinning existed.
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
