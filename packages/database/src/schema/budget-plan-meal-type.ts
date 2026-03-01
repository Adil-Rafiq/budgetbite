import { pgTable, uuid, integer, uniqueIndex } from 'drizzle-orm/pg-core';

import { budgetPlan } from './budget-plan.js';
import { mealType } from './meal-type.js';

export const budgetPlanMealType = pgTable(
  'budget_plan_meal_type',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    budgetPlanId: uuid('budget_plan_id')
      .notNull()
      .references(() => budgetPlan.id, { onDelete: 'cascade' }),
    mealTypeId: uuid('meal_type_id')
      .notNull()
      .references(() => mealType.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
  },
  (table) => [
    uniqueIndex('unique_budget_plan_position').on(table.budgetPlanId, table.position),
    uniqueIndex('unique_budget_plan_meal_type').on(table.budgetPlanId, table.mealTypeId),
  ],
);
