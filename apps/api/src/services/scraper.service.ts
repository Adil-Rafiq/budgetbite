import type {
  FinishScraperRunInput,
  ListScraperRunsQuery,
  StartScraperRunInput,
} from '@repo/shared';
import { scraperRunRepository, type ScraperRun } from '@repo/database';

import { AppError } from '../middleware/error.middleware.js';

function toResponse(run: ScraperRun) {
  return {
    ...run,
    latitude: run.latitude != null ? Number(run.latitude) : null,
    longitude: run.longitude != null ? Number(run.longitude) : null,
  };
}

export const scraperService = {
  async start(input: StartScraperRunInput) {
    const run = await scraperRunRepository.create({
      source: input.source ?? 'foodpanda',
      status: 'running',
      area: input.area ?? null,
      latitude: input.latitude != null ? String(input.latitude) : null,
      longitude: input.longitude != null ? String(input.longitude) : null,
    });
    return toResponse(run);
  },

  async finish(id: string, input: FinishScraperRunInput) {
    const existing = await scraperRunRepository.findById(id);
    if (!existing) throw new AppError(404, 'Scraper run not found', 'NOT_FOUND');
    const run = await scraperRunRepository.update(id, {
      status: input.status,
      ...(input.restaurantsUpserted !== undefined && {
        restaurantsUpserted: input.restaurantsUpserted,
      }),
      ...(input.itemsUpserted !== undefined && { itemsUpserted: input.itemsUpserted }),
      errorMessage: input.errorMessage ?? null,
      finishedAt: new Date(),
    });
    return toResponse(run);
  },

  async list(query: ListScraperRunsQuery) {
    const { limit, offset } = query;
    const [data, total] = await Promise.all([
      scraperRunRepository.list(limit, offset),
      scraperRunRepository.count(),
    ]);
    return {
      data: data.map(toResponse),
      meta: { total, limit, offset },
    };
  },
};
