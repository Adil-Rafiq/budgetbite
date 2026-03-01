import type { Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';
import { AppError } from './error.middleware.js';
import type { AuthRequest } from './auth.middleware.js';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

const getSessionUser = async (req: AuthRequest) => {
  const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });
  return session?.user ?? null;
};

const attachUser = (
  req: AuthRequest,
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>,
) => {
  req.userId = user.id;
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    name: user.name,
  };
};

export async function requireAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await getSessionUser(req);

  if (!user) {
    next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
    return;
  }

  if (user.role !== 'admin') {
    next(new AppError(403, 'Admin access required', 'FORBIDDEN'));
    return;
  }

  attachUser(req, user);
  next();
}

export async function requireAdminOrService(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  // scraper / service via API key
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && ADMIN_API_KEY && apiKey === ADMIN_API_KEY) {
    next();
    return;
  }

  // admin user via Better Auth session
  const user = await getSessionUser(req);

  if (!user) {
    next(new AppError(403, 'Admin or service authentication required', 'FORBIDDEN'));
    return;
  }

  if (user.role !== 'admin') {
    next(new AppError(403, 'Admin access required', 'FORBIDDEN'));
    return;
  }

  attachUser(req, user);
  next();
}
