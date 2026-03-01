import { account, session, user, verification } from '../auth.js';
import { userProfile } from '../user-profile.js';
import { budgetPlanMealTypes } from '../budget-plan-meal-types.js';
import { budgetPlans } from '../budget-plans.js';
import { feedback } from '../feedback.js';
import { mealSuggestions, mealPlanGenerations } from '../meal-plans.js';
import { mealTypes } from '../meal-types.js';
import { menuItems } from '../menu-items.js';
import { mealChoices } from '../orders.js';
import { restaurants } from '../restaurants.js';

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
export type BudgetPlanMealType = typeof budgetPlanMealTypes.$inferSelect;
export type NewBudgetPlanMealType = typeof budgetPlanMealTypes.$inferInsert;
export type UpdateBudgetPlanMealType = Partial<Omit<NewBudgetPlanMealType, 'id'>>;

// Budget plan types
export type BudgetPlan = typeof budgetPlans.$inferSelect;
export type NewBudgetPlan = typeof budgetPlans.$inferInsert;
export type UpdateBudgetPlan = Partial<Omit<NewBudgetPlan, 'id'>>;

// Feedback types
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type UpdateFeedback = Partial<Omit<NewFeedback, 'id'>>;

// Meal plan generation types
export type MealPlanGeneration = typeof mealPlanGenerations.$inferSelect;
export type NewMealPlanGeneration = typeof mealPlanGenerations.$inferInsert;
export type UpdateMealPlanGeneration = Partial<Omit<NewMealPlanGeneration, 'id'>>;

// Meal suggestion types
export type MealSuggestion = typeof mealSuggestions.$inferSelect;
export type NewMealSuggestion = typeof mealSuggestions.$inferInsert;
export type UpdateMealSuggestion = Partial<Omit<NewMealSuggestion, 'id'>>;

// Meal type types
export type MealType = typeof mealTypes.$inferSelect;
export type NewMealType = typeof mealTypes.$inferInsert;
export type UpdateMealType = Partial<Omit<NewMealType, 'id'>>;

// Menu item types
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type UpdateMenuItem = Partial<Omit<NewMenuItem, 'id'>>;

// Meal choice types
export type MealChoice = typeof mealChoices.$inferSelect;
export type NewMealChoice = typeof mealChoices.$inferInsert;
export type UpdateMealChoice = Partial<Omit<NewMealChoice, 'id'>>;

// Restaurant types
export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;
export type UpdateRestaurant = Partial<Omit<NewRestaurant, 'id'>>;
