import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware.js";
import type { AuthRequest } from "./auth.middleware.js";
import type { JwtPayload } from "./auth.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * Allows request if either:
 * 1. X-API-Key header matches ADMIN_API_KEY (scraper / service), or
 * 2. Valid JWT with role === "admin" (admin dashboard user).
 * Otherwise responds with 403.
 */
export function requireAdminOrService(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey === "string" && ADMIN_API_KEY && apiKey === ADMIN_API_KEY) {
    req.userId = undefined;
    req.user = undefined;
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    next(new AppError(403, "Admin or service authentication required", "FORBIDDEN"));
    return;
  }
  if (!JWT_SECRET) {
    next(new AppError(503, "Auth not configured", "AUTH_NOT_CONFIGURED"));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded.sub) {
      next(new AppError(403, "Invalid token", "FORBIDDEN"));
      return;
    }
    if (decoded.role !== "admin") {
      next(new AppError(403, "Admin access required", "FORBIDDEN"));
      return;
    }
    req.userId = decoded.sub;
    req.user = decoded;
    next();
  } catch {
    next(new AppError(403, "Invalid or expired token", "FORBIDDEN"));
  }
}
