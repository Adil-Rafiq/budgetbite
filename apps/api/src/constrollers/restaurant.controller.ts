import type { Request, Response } from "express";
import { listRestaurantsSchema, uuidSchema } from "../lib/validation.js";
import { restaurantService } from "../services/restaurant.service.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { userRepository } from "@budgetbite/database";

export async function listRestaurants(req: AuthRequest, res: Response): Promise<void> {
  const query = listRestaurantsSchema.parse(req.query);
  let userLat: number | undefined;
  let userLng: number | undefined;
  if (req.userId) {
    const user = await userRepository.findById(req.userId);
    if (user?.latitude != null && user?.longitude != null) {
      userLat = Number(user.latitude);
      userLng = Number(user.longitude);
    }
  }
  const list = await restaurantService.list(query, userLat, userLng);
  res.json(list);
}

export async function getRestaurant(req: Request, res: Response): Promise<void> {
  const id = uuidSchema.parse(req.params.id);
  const restaurant = await restaurantService.getById(id);
  res.json(restaurant);
}

export async function getMenu(req: Request, res: Response): Promise<void> {
  const restaurantId = uuidSchema.parse(req.params.id);
  const menu = await restaurantService.getMenu(restaurantId);
  res.json(menu);
}
