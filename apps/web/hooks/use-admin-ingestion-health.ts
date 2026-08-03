import { useQuery } from '@tanstack/react-query';
import type { ScraperRun } from '@repo/shared';

import { adminApi } from '@/lib/api/endpoints/admin';

/**
 * How many recent runs to read to decide whether ingestion is healthy.
 *
 * `listScraperRunsQuerySchema` is pagination-only — there is no status filter
 * on the endpoint — so health is derived client-side from a recent window
 * rather than counted server-side. Twenty is enough to find the last success
 * behind a short run of failures without paging.
 */
const WINDOW = 20;

export interface IngestionHealth {
  /** Most recent run of any status, or null before the scraper has ever run. */
  latest: ScraperRun | null;
  /** Most recent run that succeeded, within the window. */
  lastSucceeded: ScraperRun | null;
  /** True when the newest run failed — i.e. ingestion is broken *now*. */
  isBroken: boolean;
  /** Consecutive failures at the head of the list. */
  consecutiveFailures: number;
}

/**
 * Ingestion health as a verdict rather than a table.
 *
 * The badge and the Overview both ask "is the scraper working", and the honest
 * answer is about the *newest* run, not a historical failure count: a run that
 * failed last week and succeeded since is not a problem, and counting it as
 * one trains the operator to ignore the badge.
 */
export const useAdminIngestionHealth = () =>
  useQuery({
    queryKey: ['admin', 'scraper-runs', 'health'] as const,
    queryFn: async (): Promise<IngestionHealth> => {
      const { data } = await adminApi.listScraperRuns({ limit: WINDOW, offset: 0 });

      // The endpoint returns newest-first, but health is a claim about
      // ordering, so sort rather than trust it.
      const runs = [...data].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );

      const latest = runs[0] ?? null;
      const lastSucceeded = runs.find((r) => r.status === 'succeeded') ?? null;

      let consecutiveFailures = 0;
      for (const run of runs) {
        if (run.status !== 'failed') break;
        consecutiveFailures += 1;
      }

      return {
        latest,
        lastSucceeded,
        // A `running` run is not broken; it is in progress.
        isBroken: latest?.status === 'failed',
        consecutiveFailures,
      };
    },
  });
