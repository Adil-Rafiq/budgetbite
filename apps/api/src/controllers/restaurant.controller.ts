import type { Request, Response } from 'express';
import type { ListRestaurantsQuery } from '@repo/shared';

import { restaurantService } from '../services/restaurant.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

type IdParams = { id: string };

export async function listRestaurants(req: AuthRequest, res: Response): Promise<void> {
  const list = await restaurantService.list(
    req.query as unknown as ListRestaurantsQuery,
    req.userId,
  );
  res.json(list);
}

export async function getRestaurant(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const restaurant = await restaurantService.getById(id);
  res.json(restaurant);
}

export async function getMenu(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const menu = await restaurantService.getMenu(id);
  res.json(menu);
}
