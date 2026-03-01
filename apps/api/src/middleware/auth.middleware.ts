import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';
import { AppError } from './error.middleware.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    name: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });

  if (!session) {
    next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
    return;
  }

  req.userId = session.user.id;
  req.user = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    emailVerified: session.user.emailVerified,
    name: session.user.name,
  };

  next();
}

export async function optionalAuthMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });

  if (session) {
    req.userId = session.user.id;
    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
      name: session.user.name,
    };
  }

  next();
}
