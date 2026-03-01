import { pgTable, doublePrecision, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { timestamps } from './common/timestamps.js';

export const userProfile = pgTable('user_profile', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  ...timestamps,
});
