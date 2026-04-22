import type { NextFunction, Request, Response } from 'express';

/**
 * Wrap an async Express handler so any rejected promise is forwarded to the
 * central error middleware. Apply at route registration, not inside
 * controllers — keeps controller bodies free of try/catch boilerplate.
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Req, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
