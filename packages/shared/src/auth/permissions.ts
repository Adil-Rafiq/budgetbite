// Static RBAC. Roles are a fixed enum (mirrors the better-auth `role` field);
// permissions are derived from role here so both the API (enforcement) and the
// web app (showing/hiding UI) share one source of truth. Admin has everything;
// add a narrower role by giving it a subset.

export const PERMISSIONS = [
  'restaurant:read',
  'restaurant:write',
  'restaurant:delete',
  'meal-type:read',
  'meal-type:write',
  'meal-type:delete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type Role = 'user' | 'admin';

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  user: [],
  admin: PERMISSIONS,
};

export const can = (role: Role, permission: Permission): boolean =>
  ROLE_PERMISSIONS[role].includes(permission);
