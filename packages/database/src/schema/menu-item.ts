import { decimal, index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './common/timestamps.js';
import { restaurant } from './restaurant.js';

export const menuItem = pgTable(
  'menu_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    imageUrl: text('image_url'),
    /**
     * The vendor's own menu section — "Starters", "Deals", "Cold Drinks".
     *
     * Nullable on purpose. Every row scraped before this column existed has
     * none, and Foodpanda pages that render one flat product list give the
     * scraper nothing to record. Readers must therefore treat null as "not
     * known", never as a category called "Other" — the UI groups the known
     * ones and leaves the rest under a plain heading.
     */
    category: text('category'),

    ...timestamps,
  },
  (table) => [
    unique('unique_restaurant_item').on(table.restaurantId, table.name),
    // The default menu ordering is (category, name) scoped to one restaurant,
    // and it is now paged — without this the server sorts the whole 365-row
    // menu on every 24-row page request.
    index('menu_item_restaurant_category_name_idx').on(
      table.restaurantId,
      table.category,
      table.name,
    ),
    // Price sorts and the "hide over-budget" ceiling filter are the other two
    // orderings the menu endpoint accepts.
    index('menu_item_restaurant_price_idx').on(table.restaurantId, table.price),
  ],
);
