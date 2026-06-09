import type { Request, Response } from 'express';
import type {
  CreateMealTypeInput,
  CreateMenuItemInput,
  CreateRestaurantInput,
  FinishScraperRunInput,
  ListAuditLogsQuery,
  ListRestaurantsQuery,
  ListScraperRunsQuery,
  ListUsersQuery,
  StartScraperRunInput,
  UpdateMealTypeInput,
  UpdateMenuItemInput,
  UpdateRestaurantInput,
  UpdateUserRoleInput,
} from '@repo/shared';

import { restaurantService } from '../services/restaurant.service.js';
import { mealTypeService } from '../services/meal-type.service.js';
import { auditService } from '../services/audit.service.js';
import { scraperService } from '../services/scraper.service.js';
import { userService } from '../services/user.service.js';
import { getActor } from '../lib/audit-actor.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

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

export async function createRestaurant(req: AuthRequest, res: Response): Promise<void> {
  const restaurant = await restaurantService.createRestaurant(
    req.body as CreateRestaurantInput,
    getActor(req),
  );
  res.status(201).json(restaurant);
}

export async function updateRestaurant(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const restaurant = await restaurantService.updateRestaurant(
    id,
    req.body as UpdateRestaurantInput,
    getActor(req),
  );
  res.json(restaurant);
}

export async function deleteRestaurant(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  await restaurantService.deleteRestaurant(id, getActor(req));
  res.status(204).send();
}

// ─── Menu items ───────────────────────────────────────────────────────────────

export async function listMenuItems(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const items = await restaurantService.getMenu(id);
  res.json(items);
}

export async function createMenuItems(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const body = req.body as CreateMenuItemInput | CreateMenuItemInput[];
  const items = await restaurantService.createMenuItems(id, body, getActor(req));
  res.status(201).json(Array.isArray(body) ? items : items[0]);
}

export async function updateMenuItem(req: AuthRequest, res: Response): Promise<void> {
  const { id, itemId } = req.params as ItemParams;
  const item = await restaurantService.updateMenuItem(
    id,
    itemId,
    req.body as UpdateMenuItemInput,
    getActor(req),
  );
  res.json(item);
}

export async function deleteMenuItem(req: AuthRequest, res: Response): Promise<void> {
  const { id, itemId } = req.params as ItemParams;
  await restaurantService.deleteMenuItem(id, itemId, getActor(req));
  res.status(204).send();
}

// ─── Meal types ───────────────────────────────────────────────────────────────

export async function listMealTypes(_req: Request, res: Response): Promise<void> {
  const types = await mealTypeService.listAll();
  res.json(types);
}

export async function createMealType(req: AuthRequest, res: Response): Promise<void> {
  const type = await mealTypeService.create(req.body as CreateMealTypeInput, getActor(req));
  res.status(201).json(type);
}

export async function updateMealType(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const type = await mealTypeService.update(id, req.body as UpdateMealTypeInput, getActor(req));
  res.json(type);
}

export async function deleteMealType(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  await mealTypeService.delete(id, getActor(req));
  res.status(204).send();
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListAuditLogsQuery;
  const result = await auditService.list({
    entityType: query.entityType,
    action: query.action,
    limit: query.limit,
    offset: query.offset,
  });
  res.json(result);
}

// ─── Scraper runs ───────────────────────────────────────────────────────────

export async function listScraperRuns(req: Request, res: Response): Promise<void> {
  const result = await scraperService.list(req.query as unknown as ListScraperRunsQuery);
  res.json(result);
}

export async function startScraperRun(req: Request, res: Response): Promise<void> {
  const run = await scraperService.start(req.body as StartScraperRunInput);
  res.status(201).json(run);
}

export async function finishScraperRun(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const run = await scraperService.finish(id, req.body as FinishScraperRunInput);
  res.json(run);
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response): Promise<void> {
  const result = await userService.list(req.query as unknown as ListUsersQuery);
  res.json(result);
}

export async function updateUserRole(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const user = await userService.updateRole(id, req.body as UpdateUserRoleInput, getActor(req));
  res.json(user);
}
