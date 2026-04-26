import { z } from 'zod';

import { uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const createMenuItemSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().positive(),
  imageUrl: z.url().max(2000).optional(),
});

// POST /admin/restaurants/:id/menu-items accepts either a single item or an array.
export const createMenuItemsSchema = z.union([
  createMenuItemSchema,
  z.array(createMenuItemSchema).min(1),
]);

export const updateMenuItemSchema = createMenuItemSchema.partial();

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const menuItemSchema = z.object({
  id: uuidSchema,
  restaurantId: uuidSchema,
  name: z.string().min(1).max(300),
  description: z.string().max(2000).nullable(),
  price: z.number().positive(),
  imageUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
