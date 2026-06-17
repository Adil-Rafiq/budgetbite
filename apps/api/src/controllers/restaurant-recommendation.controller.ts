import type { Response } from 'express';
import type {
  CreateRestaurantRecommendationInput,
  ListRestaurantRecommendationsQuery,
} from '@repo/shared';

import { restaurantRecommendationService } from '../services/restaurant-recommendation.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export async function submitRecommendation(req: AuthRequest, res: Response): Promise<void> {
  const result = await restaurantRecommendationService.submit(
    req.userId!,
    req.body as CreateRestaurantRecommendationInput,
  );
  res.status(201).json(result);
}

export async function listMyRecommendations(req: AuthRequest, res: Response): Promise<void> {
  const result = await restaurantRecommendationService.listMine(
    req.userId!,
    req.query as unknown as ListRestaurantRecommendationsQuery,
  );
  res.json(result);
}
