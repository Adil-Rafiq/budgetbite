import { isNotFound } from '@/lib/api/errors';

/**
 * Wraps a query function so that 404s return null instead of throwing.
 * Use this for any resource that may legitimately not exist.
 */
export const orNull = <T>(fn: () => Promise<T>): Promise<T | null> =>
  fn().catch((err) => {
    if (isNotFound(err)) return null;
    throw err;
  });
