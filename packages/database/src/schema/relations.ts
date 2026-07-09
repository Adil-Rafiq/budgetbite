import { relations } from 'drizzle-orm';
import { user, session, account } from './auth.js';
import { userProfile } from './user-profile.js';
import { userPreferences } from './user-preferences.js';
import { budgetPlan } from './budget-plan.js';
import { planContext } from './plan-context.js';
import { mealType } from './meal-type.js';
import { restaurant } from './restaurant.js';
import { menuItem } from './menu-item.js';
import {
  mealPlanGeneration,
  mealSlotReroll,
  mealSuggestion,
  mealSuggestionItem,
} from './meal-plan.js';
import { mealChoice } from './order.js';
import { mealPin } from './meal-pin.js';
import { userFoodPreference } from './user-food-preference.js';
import { feedback } from './feedback.js';
import { restaurantRecommendation } from './restaurant-recommendation.js';
import { budgetPlanMealType } from './budget-plan-meal-type.js';

// User Relations
export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  userProfile: one(userProfile),
  budgetPlans: many(budgetPlan),
  mealChoices: many(mealChoice),
  mealPins: many(mealPin),
  foodPreferences: many(userFoodPreference),
  feedbacks: many(feedback),
  restaurantRecommendations: many(restaurantRecommendation),
}));

// Session Relations
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

// Account Relations
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// User Profile Relations
export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
}));

// Budget Plan Relations
export const budgetPlanRelations = relations(budgetPlan, ({ one, many }) => ({
  user: one(user, {
    fields: [budgetPlan.userId],
    references: [user.id],
  }),
  planContext: one(planContext, {
    fields: [budgetPlan.id],
    references: [planContext.budgetPlanId],
  }),
  budgetPlanMealTypes: many(budgetPlanMealType),
  mealGenerations: many(mealPlanGeneration),
  mealChoices: many(mealChoice),
  mealPins: many(mealPin),
}));

// Meal Type Relations
export const mealTypeRelations = relations(mealType, ({ many }) => ({
  budgetPlanMealTypes: many(budgetPlanMealType),
  mealSuggestions: many(mealSuggestion),
  mealChoices: many(mealChoice),
  mealPins: many(mealPin),
}));

// Restaurant Relations
export const restaurantRelations = relations(restaurant, ({ many }) => ({
  menuItems: many(menuItem),
  mealSuggestions: many(mealSuggestion),
  mealChoices: many(mealChoice),
  mealPins: many(mealPin),
}));

// Menu Item Relations
export const menuItemRelations = relations(menuItem, ({ one, many }) => ({
  restaurant: one(restaurant, {
    fields: [menuItem.restaurantId],
    references: [restaurant.id],
  }),
  mealSuggestionItems: many(mealSuggestionItem),
  mealChoices: many(mealChoice),
  mealPins: many(mealPin),
}));

// Meal Plan Generation Relations
export const mealPlanGenerationRelations = relations(mealPlanGeneration, ({ one, many }) => ({
  budgetPlan: one(budgetPlan, {
    fields: [mealPlanGeneration.budgetPlanId],
    references: [budgetPlan.id],
  }),
  mealSuggestions: many(mealSuggestion),
  slotRerolls: many(mealSlotReroll),
}));

// Meal Slot Reroll Relations
export const mealSlotRerollRelations = relations(mealSlotReroll, ({ one }) => ({
  budgetPlan: one(budgetPlan, {
    fields: [mealSlotReroll.budgetPlanId],
    references: [budgetPlan.id],
  }),
  generation: one(mealPlanGeneration, {
    fields: [mealSlotReroll.generationId],
    references: [mealPlanGeneration.id],
  }),
  mealType: one(mealType, {
    fields: [mealSlotReroll.mealTypeId],
    references: [mealType.id],
  }),
}));

// Meal Suggestion Relations
export const mealSuggestionRelations = relations(mealSuggestion, ({ one, many }) => ({
  mealPlanGeneration: one(mealPlanGeneration, {
    fields: [mealSuggestion.generationId],
    references: [mealPlanGeneration.id],
  }),
  mealType: one(mealType, {
    fields: [mealSuggestion.mealTypeId],
    references: [mealType.id],
  }),
  restaurant: one(restaurant, {
    fields: [mealSuggestion.restaurantId],
    references: [restaurant.id],
  }),
  items: many(mealSuggestionItem),
  mealChoices: many(mealChoice),
}));

// Meal Suggestion Item Relations
export const mealSuggestionItemRelations = relations(mealSuggestionItem, ({ one }) => ({
  mealSuggestion: one(mealSuggestion, {
    fields: [mealSuggestionItem.suggestionId],
    references: [mealSuggestion.id],
  }),
  menuItem: one(menuItem, {
    fields: [mealSuggestionItem.menuItemId],
    references: [menuItem.id],
  }),
}));

// Meal Choice Relations
export const mealChoiceRelations = relations(mealChoice, ({ one, many }) => ({
  user: one(user, {
    fields: [mealChoice.userId],
    references: [user.id],
  }),
  budgetPlan: one(budgetPlan, {
    fields: [mealChoice.budgetPlanId],
    references: [budgetPlan.id],
  }),
  mealType: one(mealType, {
    fields: [mealChoice.mealTypeId],
    references: [mealType.id],
  }),
  mealSuggestion: one(mealSuggestion, {
    fields: [mealChoice.suggestionId],
    references: [mealSuggestion.id],
  }),
  restaurant: one(restaurant, {
    fields: [mealChoice.restaurantId],
    references: [restaurant.id],
  }),
  menuItem: one(menuItem, {
    fields: [mealChoice.menuItemId],
    references: [menuItem.id],
  }),
  feedbacks: many(feedback),
}));

// Meal Pin Relations
export const mealPinRelations = relations(mealPin, ({ one }) => ({
  user: one(user, {
    fields: [mealPin.userId],
    references: [user.id],
  }),
  budgetPlan: one(budgetPlan, {
    fields: [mealPin.budgetPlanId],
    references: [budgetPlan.id],
  }),
  mealType: one(mealType, {
    fields: [mealPin.mealTypeId],
    references: [mealType.id],
  }),
  restaurant: one(restaurant, {
    fields: [mealPin.restaurantId],
    references: [restaurant.id],
  }),
  menuItem: one(menuItem, {
    fields: [mealPin.menuItemId],
    references: [menuItem.id],
  }),
}));

// User Food Preference Relations (favorites & block list)
export const userFoodPreferenceRelations = relations(userFoodPreference, ({ one }) => ({
  user: one(user, {
    fields: [userFoodPreference.userId],
    references: [user.id],
  }),
  restaurant: one(restaurant, {
    fields: [userFoodPreference.restaurantId],
    references: [restaurant.id],
  }),
  menuItem: one(menuItem, {
    fields: [userFoodPreference.menuItemId],
    references: [menuItem.id],
  }),
}));

// Feedback Relations
export const feedbackRelations = relations(feedback, ({ one }) => ({
  mealChoice: one(mealChoice, {
    fields: [feedback.mealChoiceId],
    references: [mealChoice.id],
  }),
  user: one(user, {
    fields: [feedback.userId],
    references: [user.id],
  }),
}));

// Restaurant Recommendation Relations
export const restaurantRecommendationRelations = relations(restaurantRecommendation, ({ one }) => ({
  user: one(user, {
    fields: [restaurantRecommendation.userId],
    references: [user.id],
  }),
  createdRestaurant: one(restaurant, {
    fields: [restaurantRecommendation.createdRestaurantId],
    references: [restaurant.id],
  }),
}));

// Budget Plan Meal Type Relations
export const budgetPlanMealTypeRelations = relations(budgetPlanMealType, ({ one }) => ({
  budgetPlan: one(budgetPlan, {
    fields: [budgetPlanMealType.budgetPlanId],
    references: [budgetPlan.id],
  }),
  mealType: one(mealType, {
    fields: [budgetPlanMealType.mealTypeId],
    references: [mealType.id],
  }),
}));

// Plan Context Relations
export const planContextRelations = relations(planContext, ({ one }) => ({
  budgetPlan: one(budgetPlan, {
    fields: [planContext.budgetPlanId],
    references: [budgetPlan.id],
  }),
}));

// User Preferences Relations
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userPreferences.userId],
    references: [user.id],
  }),
}));
