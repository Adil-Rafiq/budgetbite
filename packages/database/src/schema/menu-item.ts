import { decimal, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

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
  (table) => [uniqueIndex('menu_item_restaurant_name_idx').on(table.restaurantId, table.name)],
);
