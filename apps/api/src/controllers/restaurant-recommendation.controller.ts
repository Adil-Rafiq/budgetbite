import type { Response } from 'express';
import type {
  CreateRestaurantRecommendationInput,
  ExtractMenuFromImageInput,
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

export async function extractMenuFromImage(req: AuthRequest, res: Response): Promise<void> {
  const result = await restaurantRecommendationService.extractMenuFromImage(
    req.userId!,
    req.body as ExtractMenuFromImageInput,
  );
  res.json(result);
}

export async function withdrawRecommendation(req: AuthRequest, res: Response): Promise<void> {
  await restaurantRecommendationService.withdraw(req.userId!, req.params.id as string);
  res.status(204).send();
}

export async function listMyRecommendations(req: AuthRequest, res: Response): Promise<void> {
  const result = await restaurantRecommendationService.listMine(
    req.userId!,
    req.query as unknown as ListRestaurantRecommendationsQuery,
  );
  res.json(result);
}
