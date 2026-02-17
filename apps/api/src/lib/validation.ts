import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const listRestaurantsSchema = paginationSchema.extend({
  maxDistanceKm: z.coerce.number().min(0).max(100).optional(),
  userLat: z.coerce.number().min(-90).max(90).optional(),
  userLng: z.coerce.number().min(-180).max(180).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

export const createBudgetPlanSchema = z.object({
  planType: z.enum(["weekly", "monthly"]),
  totalBudget: z.coerce.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealsPerDay: z.coerce.number().int().min(1).max(5),
  mealTypeIds: z.array(uuidSchema).min(1).optional(),
  notificationTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(),
});

export const updateBudgetPlanSchema = z.object({
  totalBudget: z.coerce.number().positive().optional(),
  notificationTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
});

export const recordMealChoiceSchema = z.object({
  budgetPlanId: uuidSchema,
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealTypeId: uuidSchema,
  suggestionId: uuidSchema.optional(),
  manualDescription: z.string().max(500).optional(),
  actualAmountSpent: z.coerce.number().min(0),
  restaurantName: z.string().max(200).optional(),
});

export const feedbackSchema = z.object({
  mealChoiceId: uuidSchema,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  liked: z.boolean().optional(),
  comment: z.string().max(500).optional(),
});

export const getSuggestionsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealTypeId: uuidSchema.optional(),
});

export const analyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budgetPlanId: uuidSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ListRestaurantsQuery = z.infer<typeof listRestaurantsSchema>;
export type CreateBudgetPlanInput = z.infer<typeof createBudgetPlanSchema>;
export type UpdateBudgetPlanInput = z.infer<typeof updateBudgetPlanSchema>;
export type RecordMealChoiceInput = z.infer<typeof recordMealChoiceSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type GetSuggestionsQuery = z.infer<typeof getSuggestionsSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
