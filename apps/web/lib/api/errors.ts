import { HTTPError } from 'ky';

export const getErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  if (err instanceof HTTPError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
};

export const isNotFound = (err: unknown): boolean =>
  err instanceof HTTPError && err.response.status === 404;

export const isUnauthorized = (err: unknown): boolean =>
  err instanceof HTTPError && err.response.status === 401;
