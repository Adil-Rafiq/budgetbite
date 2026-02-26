import { pgTable, uuid, integer, uniqueIndex } from 'drizzle-orm/pg-core';

import { budgetPlans } from './budget-plans.js';
import { mealTypes } from './meal-types.js';

export const budgetPlanMealTypes = pgTable(
  'budget_plan_meal_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    budgetPlanId: uuid('budget_plan_id')
      .notNull()
      .references(() => budgetPlans.id, { onDelete: 'cascade' }),
    mealTypeId: uuid('meal_type_id')
      .notNull()
      .references(() => mealTypes.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
  },
  (table) => [
    uniqueIndex('unique_budget_plan_position').on(table.budgetPlanId, table.position),
    uniqueIndex('unique_budget_plan_meal_type').on(table.budgetPlanId, table.mealTypeId),
  ],
);

export type BudgetPlanMealType = typeof budgetPlanMealTypes.$inferSelect;
export type NewBudgetPlanMealType = typeof budgetPlanMealTypes.$inferInsert;
