import type { NextFunction, Response } from 'express';
import type { ZodType } from 'zod';

import type { AuthRequest } from './auth.middleware.js';

/**
 * Middleware factory that runs Zod schemas against params/query/body and
 * replaces each slot with the parsed (coerced, defaulted) value. Controllers
 * never call `.parse()` themselves — they read already-typed fields.
 *
 * ZodError is forwarded to errorMiddleware which formats it as
 * `{ error, code: 'VALIDATION_ERROR' }`.
 */
export function validate(schemas: {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // Express 5 exposes req.query as a getter with no setter; use
        // defineProperty to install a replacement that behaves like a plain object.
        Object.defineProperty(req, 'query', {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
