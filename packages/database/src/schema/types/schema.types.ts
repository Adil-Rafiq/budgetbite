import { account, session, user, verification } from '../auth.js';
import { userProfile } from '../user-profile.js';
import { budgetPlanMealType } from '../budget-plan-meal-type.js';
import { budgetPlan } from '../budget-plan.js';
import { feedback } from '../feedback.js';
import { mealSuggestion, mealPlanGeneration } from '../meal-plan.js';
import { mealType } from '../meal-type.js';
import { menuItem } from '../menu-item.js';
import { mealChoice } from '../order.js';
import { restaurant } from '../restaurant.js';
import { planContext } from '../plan-context.js';
import { userPreferences } from '../user-preferences.js';

// Auth types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified'>>;

export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;

// User profile types
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type UpdateUserProfile = Partial<Omit<NewUserProfile, 'userId'>>;

// Budget plan meal types
export type BudgetPlanMealType = typeof budgetPlanMealType.$inferSelect;
export type NewBudgetPlanMealType = typeof budgetPlanMealType.$inferInsert;
export type UpdateBudgetPlanMealType = Partial<Omit<NewBudgetPlanMealType, 'id'>>;

// Budget plan types
export type BudgetPlan = typeof budgetPlan.$inferSelect;
export type NewBudgetPlan = typeof budgetPlan.$inferInsert;
export type UpdateBudgetPlan = Partial<
  Omit<NewBudgetPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
>;

// Feedback types
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type UpdateFeedback = Partial<Omit<NewFeedback, 'id'>>;

// Meal plan generation types
export type MealPlanGeneration = typeof mealPlanGeneration.$inferSelect;
export type NewMealPlanGeneration = typeof mealPlanGeneration.$inferInsert;
export type UpdateMealPlanGeneration = Partial<Omit<NewMealPlanGeneration, 'id'>>;

// Meal suggestion types
export type MealSuggestion = typeof mealSuggestion.$inferSelect;
export type NewMealSuggestion = typeof mealSuggestion.$inferInsert;
export type UpdateMealSuggestion = Partial<Omit<NewMealSuggestion, 'id'>>;

// Meal type types
export type MealType = typeof mealType.$inferSelect;
export type NewMealType = typeof mealType.$inferInsert;
export type UpdateMealType = Partial<Omit<NewMealType, 'id'>>;

// Menu item types
export type MenuItem = typeof menuItem.$inferSelect;
export type NewMenuItem = typeof menuItem.$inferInsert;
export type UpdateMenuItem = Partial<Omit<NewMenuItem, 'id'>>;

// Meal choice types
export type MealChoice = typeof mealChoice.$inferSelect;
export type NewMealChoice = typeof mealChoice.$inferInsert;
export type UpdateMealChoice = Partial<Omit<NewMealChoice, 'id'>>;

// Restaurant types
export type Restaurant = typeof restaurant.$inferSelect;
export type NewRestaurant = typeof restaurant.$inferInsert;
export type UpdateRestaurant = Partial<Omit<NewRestaurant, 'id'>>;

// Plan context types
export type PlanContext = typeof planContext.$inferSelect;
export type NewPlanContext = typeof planContext.$inferInsert;
export type UpdatePlanContext = Partial<Omit<NewPlanContext, 'budgetPlanId'>>;

// User preferences types
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type UpdateUserPreferences = Partial<Omit<NewUserPreferences, 'userId'>>;
