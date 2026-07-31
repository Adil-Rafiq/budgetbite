import { z } from 'zod';

import { paginatedSchema, paginationSchema, uuidSchema } from './common.js';

// ─── Inputs ─────────────────────────────────────────────────────────────────

export const createMenuItemSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().positive(),
  imageUrl: z.url().max(2000).optional(),
  /**
   * The vendor's own menu section ("Starters", "Deals"). Optional because the
   * scraper only sends it when the page actually groups its products, and
   * because every row created before this field existed has none.
   */
  category: z.string().trim().min(1).max(120).optional(),
});

// POST /admin/restaurants/:id/menu-items accepts either a single item or an array.
export const createMenuItemsSchema = z.union([
  createMenuItemSchema,
  z.array(createMenuItemSchema).min(1),
]);

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  /**
   * `null` clears the section — an admin correcting a mis-scraped grouping needs
   * a way to say "this item belongs to none", which omitting the key cannot
   * express because omission already means "leave it alone".
   */
  category: z.string().trim().min(1).max(120).nullish(),
});

/**
 * `default` is the vendor's own shelf order: category first, then name. It is
 * the only ordering under which the client can draw section headings, because
 * it is the only one that keeps a category's items contiguous across pages.
 */
export const menuSortSchema = z.enum(['default', 'price-asc', 'price-desc']);

/** Sentinel `category` value selecting the items that have none. */
export const UNCATEGORIZED = 'uncategorized';

/**
 * GET /restaurants/:id/menu.
 *
 * Every one of these used to be applied in the browser over the whole menu,
 * which meant downloading all 365 items — descriptions and image URLs included
 * — before the first one could be drawn. Searching and sorting a menu is work
 * the database already does on an index, so it does it, and the response
 * carries one screenful.
 */
export const listMenuSchema = paginationSchema.extend({
  /** Case-insensitive contains-match on the item name. */
  q: z.string().trim().min(1).max(200).optional(),
  /** Exact category match; `uncategorized` selects the items that have none. */
  category: z.string().trim().min(1).max(120).optional(),
  /**
   * Menu-price ceiling for the "hide over-budget" filter. The caller derives it
   * with `maxMenuPriceWithinBudget`, so the fit thresholds stay defined in one
   * place instead of being re-expressed as a server-side budget calculation.
   */
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: menuSortSchema.default('default'),
});

// ─── Response DTOs ──────────────────────────────────────────────────────────

export const menuItemSchema = z.object({
  id: uuidSchema,
  restaurantId: uuidSchema,
  name: z.string().min(1).max(300),
  description: z.string().max(2000).nullable(),
  price: z.number().positive(),
  imageUrl: z.string().url().nullable(),
  /** Null when the vendor's page had no sections, or the row predates them. */
  category: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const listMenuResponseSchema = paginatedSchema(menuItemSchema);

export const menuCategoryFacetSchema = z.object({
  /** Null for the items that carry no category. */
  category: z.string().nullable(),
  count: z.number().int().positive(),
});

/**
 * Everything the menu header says about a menu *as a whole* — item count, price
 * range, average, how fresh the prices are, and which sections exist.
 *
 * Separate from the items because it is the part that must not move as the
 * reader pages or filters: "12 of 365 items" needs a 365 that no page request
 * can change, and category chips that disappeared as you narrowed the list
 * would be a navigation aid you cannot navigate back with.
 */
export const menuFacetsSchema = z.object({
  count: z.number().int().nonnegative(),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  avgPrice: z.number().nullable(),
  /** Newest `updatedAt` across the menu; null when the menu is empty. */
  pricesUpdatedAt: z.coerce.date().nullable(),
  categories: z.array(menuCategoryFacetSchema),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type MenuSort = z.infer<typeof menuSortSchema>;
export type ListMenuQuery = z.infer<typeof listMenuSchema>;
export type ListMenuResponse = z.infer<typeof listMenuResponseSchema>;
export type MenuCategoryFacet = z.infer<typeof menuCategoryFacetSchema>;
export type MenuFacets = z.infer<typeof menuFacetsSchema>;
