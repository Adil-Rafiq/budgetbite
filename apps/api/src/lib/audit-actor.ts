import type { AuthRequest } from '../middleware/auth.middleware.js';

export interface AuditActor {
  actorType: 'user' | 'service';
  actorId: string | null;
  actorName: string | null;
}

/**
 * Derive who is performing an admin action: a logged-in admin (`req.user`,
 * attached by the permission guard) or the service-key caller (the scraper),
 * which has no session user.
 */
export function getActor(req: AuthRequest): AuditActor {
  if (req.user) {
    return { actorType: 'user', actorId: req.user.id, actorName: req.user.name };
  }
  return { actorType: 'service', actorId: null, actorName: null };
}
