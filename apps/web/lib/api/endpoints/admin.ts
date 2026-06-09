import { apiClient } from '@/lib/api/client';
import type {
  AdminPlanDetail,
  AdminPlanListResponse,
  AuditLogListResponse,
  DataQuality,
  CreateMealTypeInput,
  CreateMenuItemInput,
  CreateRestaurantInput,
  ListAuditLogsQuery,
  ListAdminPlansQuery,
  ListRestaurantsQuery,
  ListRestaurantsResponse,
  ListScraperRunsQuery,
  ListUsersQuery,
  MealType,
  MenuItem,
  Restaurant,
  ScraperRunListResponse,
  UpdateMealTypeInput,
  UpdateMenuItemInput,
  UpdateRestaurantInput,
  UpdateUserRoleInput,
  User,
  UserListResponse,
} from '@repo/shared';

function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) out[k] = v as string | number;
  }
  return out;
}

export const adminApi = {
  listRestaurants: (query: Partial<ListRestaurantsQuery>) =>
    apiClient
      .get('api/admin/restaurants', { searchParams: stripUndefined(query) })
      .json<ListRestaurantsResponse>(),

  createRestaurant: (input: CreateRestaurantInput) =>
    apiClient.post('api/admin/restaurants', { json: input }).json<Restaurant>(),

  updateRestaurant: (id: string, input: UpdateRestaurantInput) =>
    apiClient.patch(`api/admin/restaurants/${id}`, { json: input }).json<Restaurant>(),

  getRestaurant: (id: string) => apiClient.get(`api/admin/restaurants/${id}`).json<Restaurant>(),

  deleteRestaurant: async (id: string): Promise<void> => {
    // 204 No Content — don't parse a body.
    await apiClient.delete(`api/admin/restaurants/${id}`);
  },

  // ── Menu items (nested under a restaurant) ──
  listMenuItems: (restaurantId: string) =>
    apiClient.get(`api/admin/restaurants/${restaurantId}/menu-items`).json<MenuItem[]>(),

  // Posting a single object returns a single MenuItem (array in → array out).
  createMenuItem: (restaurantId: string, input: CreateMenuItemInput) =>
    apiClient
      .post(`api/admin/restaurants/${restaurantId}/menu-items`, { json: input })
      .json<MenuItem>(),

  updateMenuItem: (restaurantId: string, itemId: string, input: UpdateMenuItemInput) =>
    apiClient
      .patch(`api/admin/restaurants/${restaurantId}/menu-items/${itemId}`, { json: input })
      .json<MenuItem>(),

  deleteMenuItem: async (restaurantId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`api/admin/restaurants/${restaurantId}/menu-items/${itemId}`);
  },

  // Admin meal-types list includes inactive rows (unlike the public endpoint).
  listMealTypes: () => apiClient.get('api/admin/meal-types').json<MealType[]>(),

  createMealType: (input: CreateMealTypeInput) =>
    apiClient.post('api/admin/meal-types', { json: input }).json<MealType>(),

  updateMealType: (id: string, input: UpdateMealTypeInput) =>
    apiClient.patch(`api/admin/meal-types/${id}`, { json: input }).json<MealType>(),

  deleteMealType: async (id: string): Promise<void> => {
    // 204 No Content; 409 if a plan still references it.
    await apiClient.delete(`api/admin/meal-types/${id}`);
  },

  // ── Audit log ──
  listAuditLogs: (query: Partial<ListAuditLogsQuery>) =>
    apiClient
      .get('api/admin/audit-logs', { searchParams: stripUndefined(query) })
      .json<AuditLogListResponse>(),

  // ── Scraper runs ──
  listScraperRuns: (query: Partial<ListScraperRunsQuery>) =>
    apiClient
      .get('api/admin/scraper-runs', { searchParams: stripUndefined(query) })
      .json<ScraperRunListResponse>(),

  // ── Users ──
  listUsers: (query: Partial<ListUsersQuery>) =>
    apiClient
      .get('api/admin/users', { searchParams: stripUndefined(query) })
      .json<UserListResponse>(),

  updateUserRole: (id: string, input: UpdateUserRoleInput) =>
    apiClient.patch(`api/admin/users/${id}/role`, { json: input }).json<User>(),

  // ── Budget plans (read-only) ──
  listBudgetPlans: (query: Partial<ListAdminPlansQuery>) =>
    apiClient
      .get('api/admin/budget-plans', { searchParams: stripUndefined(query) })
      .json<AdminPlanListResponse>(),

  getBudgetPlan: (id: string) =>
    apiClient.get(`api/admin/budget-plans/${id}`).json<AdminPlanDetail>(),

  // ── Analytics ──
  getDataQuality: () => apiClient.get('api/admin/data-quality').json<DataQuality>(),
};
