import type { Request, Response } from "express";
import {
  uuidSchema,
  createRestaurantSchema,
  updateRestaurantSchema,
  createMenuItemsSchema,
  updateMenuItemSchema,
  adminGetRestaurantByExternalIdSchema,
  createMealTypeSchema,
  updateMealTypeSchema,
} from "@repo/shared";
import { restaurantService } from "../services/restaurant.service.js";
import { mealTypeRepository } from "@repo/database";

/** GET /api/admin/restaurants?externalId=xxx — for scraper to resolve id after 409. */
export async function getRestaurantByExternalId(req: Request, res: Response): Promise<void> {
  const query = adminGetRestaurantByExternalIdSchema.parse(req.query);
  const restaurant = await restaurantService.getByExternalId(query.externalId);
  res.json(restaurant);
}

export async function createRestaurant(req: Request, res: Response): Promise<void> {
  const body = createRestaurantSchema.parse(req.body);
  const restaurant = await restaurantService.createRestaurant(body);
  res.status(201).json(restaurant);
}

export async function updateRestaurant(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const body = updateRestaurantSchema.parse(req.body);
  const restaurant = await restaurantService.updateRestaurant(id, body);
  res.json(restaurant);
}

export async function deleteRestaurant(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  await restaurantService.deleteRestaurant(id);
  res.status(204).send();
}

export async function createMenuItems(req: Request, res: Response): Promise<void> {
  const restaurantId = uuidSchema.parse(req.params.id);
  const body = createMenuItemsSchema.parse(req.body);
  const items = await restaurantService.createMenuItems(restaurantId, body);
  res.status(201).json(Array.isArray(body) ? items : items[0]);
}

export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  const restaurantId = uuidSchema.parse(req.params.id);
  const itemId = uuidSchema.parse(req.params.itemId);
  const body = updateMenuItemSchema.parse(req.body);
  const item = await restaurantService.updateMenuItem(restaurantId, itemId, body);
  res.json(item);
}

export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  const restaurantId = uuidSchema.parse(req.params.id);
  const itemId = uuidSchema.parse(req.params.itemId);
  await restaurantService.deleteMenuItem(restaurantId, itemId);
  res.status(204).send();
}

// Admin: meal types
export async function listMealTypes(_req: Request, res: Response): Promise<void> {
  const types = await mealTypeRepository.list();
  res.json(types);
}

export async function createMealType(req: Request, res: Response): Promise<void> {
  const body = createMealTypeSchema.parse(req.body);
  const type = await mealTypeRepository.create({
    key: body.key,
    label: body.label,
    sortOrder: body.sortOrder ?? 0,
    active: body.active ?? true,
  });
  res.status(201).json(type);
}

export async function updateMealType(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const body = updateMealTypeSchema.parse(req.body);
  const type = await mealTypeRepository.update(id, body);
  res.json(type);
}

export async function deleteMealType(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  await mealTypeRepository.delete(id);
  res.status(204).send();
}
