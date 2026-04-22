import type { Request, Response } from 'express';
import type {
  CreateMealTypeInput,
  CreateMenuItemInput,
  CreateRestaurantInput,
  ListRestaurantsQuery,
  UpdateMealTypeInput,
  UpdateMenuItemInput,
  UpdateRestaurantInput,
} from '@repo/shared';

import { restaurantService } from '../services/restaurant.service.js';
import { mealTypeService } from '../services/meal-type.service.js';

type IdParams = { id: string };
type ItemParams = { id: string; itemId: string };
type ExternalParams = { externalId: string };

// ─── Restaurants ──────────────────────────────────────────────────────────────

export async function listRestaurants(req: Request, res: Response): Promise<void> {
  const restaurants = await restaurantService.list(req.query as unknown as ListRestaurantsQuery);
  res.json(restaurants);
}

export async function getRestaurantById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const restaurant = await restaurantService.getById(id);
  res.json(restaurant);
}

export async function getRestaurantByExternalId(req: Request, res: Response): Promise<void> {
  const { externalId } = req.params as ExternalParams;
  const restaurant = await restaurantService.getByExternalId(externalId);
  res.json(restaurant);
}

export async function createRestaurant(req: Request, res: Response): Promise<void> {
  const restaurant = await restaurantService.createRestaurant(req.body as CreateRestaurantInput);
  res.status(201).json(restaurant);
}

export async function updateRestaurant(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const restaurant = await restaurantService.updateRestaurant(
    id,
    req.body as UpdateRestaurantInput,
  );
  res.json(restaurant);
}

export async function deleteRestaurant(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  await restaurantService.deleteRestaurant(id);
  res.status(204).send();
}

// ─── Menu items ───────────────────────────────────────────────────────────────

export async function createMenuItems(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const body = req.body as CreateMenuItemInput | CreateMenuItemInput[];
  const items = await restaurantService.createMenuItems(id, body);
  res.status(201).json(Array.isArray(body) ? items : items[0]);
}

export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  const { id, itemId } = req.params as ItemParams;
  const item = await restaurantService.updateMenuItem(id, itemId, req.body as UpdateMenuItemInput);
  res.json(item);
}

export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  const { id, itemId } = req.params as ItemParams;
  await restaurantService.deleteMenuItem(id, itemId);
  res.status(204).send();
}

// ─── Meal types ───────────────────────────────────────────────────────────────

export async function listMealTypes(_req: Request, res: Response): Promise<void> {
  const types = await mealTypeService.listAll();
  res.json(types);
}

export async function createMealType(req: Request, res: Response): Promise<void> {
  const type = await mealTypeService.create(req.body as CreateMealTypeInput);
  res.status(201).json(type);
}

export async function updateMealType(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const type = await mealTypeService.update(id, req.body as UpdateMealTypeInput);
  res.json(type);
}

export async function deleteMealType(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  await mealTypeService.delete(id);
  res.status(204).send();
}
