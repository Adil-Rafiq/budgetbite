import { decimal, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';

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

    ...timestamps,
  },
  (table) => [unique('unique_restaurant_item').on(table.restaurantId, table.name)],
);
