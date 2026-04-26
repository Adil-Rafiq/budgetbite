import { z } from 'zod';

/**
 * Running budget state stored in the plan_context table. Single source of truth
 * for amountSpent, mealsConsumed, avg budget — updated transactionally on
 * every meal_choice confirmation, read by the LLM and the frontend alike.
 */
export const budgetStateContextSchema = z.object({
  totalBudget: z.coerce.number(),
  amountSpent: z.coerce.number(),
  amountRemaining: z.coerce.number(),
  totalMeals: z.number().int(),
  mealsConsumed: z.number().int(),
  mealsRemaining: z.number().int(),
  avgBudgetPerRemainingMeal: z.coerce.number(),
  cumulativeVariance: z.coerce.number(),
});

export type BudgetStateContext = z.infer<typeof budgetStateContextSchema>;
