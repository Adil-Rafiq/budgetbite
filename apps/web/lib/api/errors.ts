import { HTTPError } from 'ky';
import { planAlreadyActiveErrorSchema } from '@repo/shared';

export const getErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  if (err instanceof HTTPError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
};

export const isNotFound = (err: unknown): boolean =>
  err instanceof HTTPError && err.response.status === 404;

export const isUnauthorized = (err: unknown): boolean =>
  err instanceof HTTPError && err.response.status === 401;

/**
 * Detect a 409 from POST /api/budget-plans signaling the user already has an
 * active plan. Drives the FE replace-flow fallback when a race slipped
 * through the pre-check (e.g. another tab created a plan in parallel).
 *
 * ky's HTTPError keeps the response object but doesn't pre-parse the body,
 * so we clone it and read JSON. Returns the existing plan id on match,
 * null otherwise.
 */
export const isPlanAlreadyActive = async (
  err: unknown,
): Promise<{ existingPlanId: string } | null> => {
  if (!(err instanceof HTTPError) || err.response.status !== 409) return null;
  try {
    const body = await err.response.clone().json();
    const parsed = planAlreadyActiveErrorSchema.safeParse(body);
    return parsed.success ? parsed.data.details : null;
  } catch {
    return null;
  }
};
