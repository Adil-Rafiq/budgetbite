import { useQuery } from '@tanstack/react-query';

import { adminApi } from '@/lib/api/endpoints/admin';

const ADMIN_MAP_KEY = ['admin', 'map'] as const;

/**
 * The whole coverage map in one request.
 *
 * Unpaginated and unfiltered by design: every filter on the page is a question
 * about the set the operator is already looking at ("which of these have no
 * menu?"), so answering it client-side keeps the map from flickering through a
 * refetch on every chip. A minute of staleness is generous for a catalogue that
 * changes on a scraper's schedule.
 */
export const useAdminMap = () =>
  useQuery({
    queryKey: ADMIN_MAP_KEY,
    queryFn: () => adminApi.getCoverageMap(),
    staleTime: 60_000,
  });
