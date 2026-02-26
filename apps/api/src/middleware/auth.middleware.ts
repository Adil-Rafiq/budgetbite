import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.warn('JWT_SECRET is missing or too short; auth will reject all tokens.');
}

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  userId?: string;
  user?: JwtPayload;
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next(new AppError(401, 'Missing or invalid authorization', 'UNAUTHORIZED'));
    return;
  }

  if (!JWT_SECRET) {
    next(new AppError(503, 'Auth not configured', 'AUTH_NOT_CONFIGURED'));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded.sub) {
      next(new AppError(401, 'Invalid token', 'INVALID_TOKEN'));
      return;
    }
    req.userId = decoded.sub;
    req.user = decoded;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
  }
}

/** Sets req.userId when token is valid; does not 401 when missing. Use for optional auth (e.g. restaurant list with user location). */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !JWT_SECRET) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.sub) {
      req.userId = decoded.sub;
      req.user = decoded;
    }
  } catch {
    // ignore invalid token
  }
  next();
}
