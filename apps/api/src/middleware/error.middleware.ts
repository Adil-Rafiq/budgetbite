import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    options?: ErrorOptions, // accepts { cause }
    public readonly details?: Record<string, unknown>,
  ) {
    super(message, options);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) console.error('[AppError 5xx]', err);

    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code && { code: err.code }),
      ...(err.details && { details: err.details }),
    });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    res.status(400).json({ error: message, code: 'VALIDATION_ERROR' });
    return;
  }

  // Log unexpected errors, but never leak internals to the client
  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
