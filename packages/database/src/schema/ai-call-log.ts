import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Append-only observability record: one row per LLM call *attempt* (a single
 * logical generation with retries produces multiple rows sharing the same
 * generationId, distinguished by `attempt`). Written fire-and-forget from the
 * API's AI call sites — a failed insert must never fail the user request.
 *
 * Entries are immutable, so there is no `updatedAt` and no FKs: the trail must
 * survive the referenced user/plan/generation being deleted.
 *
 * Status values:
 *  - 'succeeded'         — response parsed + validated
 *  - 'validation_failed' — response received but JSON/schema/ID cross-check failed
 *  - 'truncated'         — provider stopped at the max-token limit (finishReason='length')
 *  - 'provider_error'    — llm.complete itself threw (network, 5xx, auth)
 */
export const aiCallLog = pgTable(
  'ai_call_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    operation: text('operation', {
      enum: [
        'plan_generate',
        'plan_replan',
        'slot_reroll',
        'menu_extraction',
        'preference_extraction',
      ],
    }).notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    status: text('status', {
      enum: ['succeeded', 'validation_failed', 'truncated', 'provider_error'],
    }).notNull(),
    /** 1-based attempt number within one logical operation (retry loop). */
    attempt: integer('attempt').notNull().default(1),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    latencyMs: integer('latency_ms').notNull(),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    userId: uuid('user_id'),
    budgetPlanId: uuid('budget_plan_id'),
    /** meal_plan_generation.id for plan/reroll operations; null otherwise. */
    generationId: uuid('generation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('ai_call_log_created_at_idx').on(table.createdAt),
    index('ai_call_log_operation_idx').on(table.operation, table.createdAt),
    index('ai_call_log_generation_idx').on(table.generationId),
  ],
);
