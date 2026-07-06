import {
  budgetPlanRepository,
  db,
  mealPlanRepository,
  mealTypeRepository,
  orderRepository,
} from '@repo/database';
import type { NewMealSuggestionWithItems, RejectedSlotOption } from '@repo/database';
import {
  aiPlanOutputSchema,
  aiSlotRerollOutputSchema,
  type AIPlanOption,
  type AIPlanOutput,
  type LLMMessage,
  type LLMResponse,
  type MealPlannerContext,
  type NearbyRestaurantContext,
  type RerollSlotInput,
  type RerollSlotResponse,
} from '@repo/shared';
import { ZodError, type ZodType } from 'zod';
import {
  SYSTEM_PROMPT,
  buildGeneratePlanPrompt,
  buildReplanPrompt,
  buildRerollSlotPrompt,
} from '@repo/ai/prompts';

import { AppError } from '../middleware/error.middleware.js';
import { logAICall, type AICallLogEntry } from '../lib/ai-log.js';
import { llm } from '../lib/llm.js';
import { contextBuilderService } from './context-builder.service.js';
import { toOption } from './meal-plan.service.js';

/**
 * Returned once the pending row exists and the LLM call is running in the
 * background. Callers poll the generation's status for the outcome.
 */
export interface GenerationKickoff {
  generationId: string;
  budgetPlanId: string;
  generatedAt: Date;
}

/**
 * Sentinel thrown from inside the suggestion-insert tx when the conditional
 * `markGenerationSucceeded` reports 0 affected rows — meaning the generation
 * was superseded by a newer kickoff while this LLM call was in flight. Throwing
 * this rolls back the suggestion insert so the superseded gen never carries
 * orphan suggestions, then the outer catch translates it into a no-op return.
 */
class SupersededError extends Error {
  constructor() {
    super('generation superseded mid-flight');
    this.name = 'SupersededError';
  }
}

const DEFAULT_GENERATION_TEMPERATURE = 0.3;
const DEFAULT_GENERATION_MAX_TOKENS = 8192;
const DEFAULT_GENERATION_MAX_RETRIES = 2; // 1 initial attempt + N retries
/** When the LLM truncates, multiply the token budget by this on the next try. */
const TRUNCATION_TOKEN_MULTIPLIER = 1.5;

function getGenerationTemperature(): number {
  const raw = process.env.AI_GENERATION_TEMPERATURE;
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 2
    ? parsed
    : DEFAULT_GENERATION_TEMPERATURE;
}

function getGenerationMaxTokens(): number {
  const raw = process.env.AI_GENERATION_MAX_TOKENS;
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)
    ? parsed
    : DEFAULT_GENERATION_MAX_TOKENS;
}

function getGenerationMaxRetries(): number {
  const raw = process.env.AI_GENERATION_MAX_RETRIES;
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && Number.isInteger(parsed)
    ? parsed
    : DEFAULT_GENERATION_MAX_RETRIES;
}

/**
 * Guard rail: how many times ONE slot can be rerolled per generation. Each
 * reroll is a paid LLM call the user can trigger with a single tap, so the cap
 * is deliberately small; a full regenerate resets the counter along with the
 * generation.
 */
const DEFAULT_MAX_SLOT_REROLLS = 3;

function getMaxSlotRerolls(): number {
  const raw = process.env.SLOT_REROLL_MAX_PER_SLOT;
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)
    ? parsed
    : DEFAULT_MAX_SLOT_REROLLS;
}

/**
 * Thrown by `parseAndValidate` when the LLM produced output that failed
 * validation but is recoverable by re-asking with feedback. Carries a
 * human-readable `feedback` string we replay to the model on the next attempt.
 */
class RetriableLLMError extends Error {
  constructor(
    message: string,
    readonly feedback: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RetriableLLMError';
  }
}

/**
 * Orchestrates the full AI meal-plan generation flow:
 *  context build -> prompt -> llm.complete -> JSON parse + validate ->
 *  cross-check ids against context -> persist generation + suggestions atomically.
 *
 * `generate` / `replan` validate preconditions (throwing AppError, e.g. 400
 * NO_NEARBY_RESTAURANTS) and insert the pending row, then hand the LLM call to
 * the background and return a kickoff. The FE polls for the result; failures are
 * written to the row, not thrown. `kickoffGenerationAsync` / `kickoffReplanAsync`
 * additionally swallow the setup errors for non-AI request paths (plan create,
 * meal-choice record).
 */
export const mealGenerationService = {
  /**
   * Validates preconditions (throws 400 for NO_REMAINING_DATES /
   * NO_NEARBY_RESTAURANTS), inserts the pending row, then runs the LLM in the
   * background — returns as soon as the row exists so the request never blocks.
   */
  async generate(userId: string, planId: string): Promise<GenerationKickoff> {
    await assertPlanOwnership(userId, planId);
    const ctx = await contextBuilderService.build(planId, userId);

    if (ctx.remainingDates.length === 0) {
      throw new AppError(400, 'No remaining dates to plan for', 'NO_REMAINING_DATES');
    }
    if (ctx.restaurants.length === 0) {
      throw new AppError(
        400,
        'No nearby restaurants available for this user',
        'NO_NEARBY_RESTAURANTS',
      );
    }

    const prompt = buildGeneratePlanPrompt(ctx);
    return startGeneration({ planId, userId, ctx, prompt, mode: 'generate' });
  },

  async replan(userId: string, planId: string, triggerSummary: string): Promise<GenerationKickoff> {
    await assertPlanOwnership(userId, planId);
    const ctx = await contextBuilderService.build(planId, userId);

    if (ctx.remainingDates.length === 0) {
      throw new AppError(400, 'No remaining dates to replan for', 'NO_REMAINING_DATES');
    }
    if (ctx.restaurants.length === 0) {
      throw new AppError(
        400,
        'No nearby restaurants available for this user',
        'NO_NEARBY_RESTAURANTS',
      );
    }

    const prompt = buildReplanPrompt(ctx, triggerSummary);
    return startGeneration({ planId, userId, ctx, prompt, mode: 'replan' });
  },

  /**
   * Regenerate the 3 options for ONE (slotDate, mealType) cell of the latest
   * succeeded generation, synchronously — a single slot is a small LLM call,
   * so the fresh options are returned in the response instead of via polling.
   *
   * The reroll is treated as implicit "none of these" feedback: the slot's
   * current options are snapshotted into meal_slot_reroll and every rejected
   * option (this reroll and prior ones) is replayed to the model as a hard
   * exclusion. Guard rails: per-slot reroll cap per generation (checked here)
   * plus the per-user route rate limiter; the slot must be open — not pinned,
   * not consumed, inside the remaining-dates window.
   */
  async rerollSlot(
    userId: string,
    planId: string,
    input: RerollSlotInput,
  ): Promise<RerollSlotResponse> {
    const plan = await budgetPlanRepository.findById(planId);
    if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
    if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    if (plan.status !== 'active') {
      throw new AppError(409, 'Only active plans can be rerolled', 'PLAN_NOT_ACTIVE');
    }

    const generationId = await mealPlanRepository.getLatestSucceededGenerationId(planId);
    if (!generationId) {
      throw new AppError(
        409,
        'No generated plan to reroll — generate suggestions first',
        'NO_ACTIVE_GENERATION',
      );
    }

    const maxRerolls = getMaxSlotRerolls();
    const usedRerolls = await mealPlanRepository.countSlotRerolls(
      generationId,
      input.slotDate,
      input.mealTypeId,
    );
    if (usedRerolls >= maxRerolls) {
      throw new AppError(
        429,
        `This slot has been rerolled ${maxRerolls} times already — pick one of the options, log your own meal, or regenerate the whole plan`,
        'SLOT_REROLL_LIMIT_REACHED',
      );
    }

    // Slot-openness is checked per (date, mealType) cell here — deliberately
    // NOT via ctx.remainingDates, which drops a whole date once any meal that
    // day is logged (fine for whole-plan prompts, wrong for a single slot:
    // logging breakfast must not block rerolling dinner).
    const today = new Date().toISOString().slice(0, 10);
    if (input.slotDate < today || input.slotDate > plan.endDate) {
      throw new AppError(400, 'This slot is no longer open for new suggestions', 'SLOT_NOT_OPEN');
    }
    if (await orderRepository.hasChoiceForSlot(planId, input.slotDate, input.mealTypeId)) {
      throw new AppError(409, 'This meal has already been logged', 'SLOT_ALREADY_LOGGED');
    }

    const ctx = await contextBuilderService.build(planId, userId);

    const mealType = ctx.plan.mealTypes.find((m) => m.id === input.mealTypeId);
    if (!mealType) {
      throw new AppError(400, 'Meal type is not part of this plan', 'INVALID_MEAL_TYPE');
    }
    if (
      ctx.pinnedSlots.some(
        (p) => p.slotDate === input.slotDate && p.mealTypeId === input.mealTypeId,
      )
    ) {
      throw new AppError(
        409,
        'This slot is pinned — unpin it to get new suggestions',
        'SLOT_PINNED',
      );
    }
    if (ctx.restaurants.length === 0) {
      throw new AppError(
        400,
        'No nearby restaurants available for this user',
        'NO_NEARBY_RESTAURANTS',
      );
    }

    // The reroll IS the feedback: snapshot the slot's current options as
    // rejected before replacing them, and replay every rejection (including
    // earlier rerolls of this slot) to the model as a hard exclusion.
    const current = await mealPlanRepository.getSuggestionsForSlot(
      generationId,
      input.slotDate,
      input.mealTypeId,
    );
    const newlyRejected: RejectedSlotOption[] = current.map((s) => ({
      restaurantId: s.restaurantId,
      restaurantName: s.restaurant?.name ?? 'Unknown restaurant',
      itemsLabel: s.items.map((i) => i.menuItem.name).join(' + '),
      menuItemIds: s.items.map((i) => i.menuItemId),
    }));
    const priorRejected = await mealPlanRepository.listRejectedOptionsForSlot(
      generationId,
      input.slotDate,
      input.mealTypeId,
    );
    const rejectedOptions = [...priorRejected, ...newlyRejected];

    const prompt = buildRerollSlotPrompt(ctx, {
      slotDate: input.slotDate,
      mealTypeKey: mealType.key,
      mealTypeLabel: mealType.label,
      slotBudget: ctx.budget.avgBudgetPerRemainingMeal,
      rejectedOptions: rejectedOptions.map((r) => ({
        restaurantName: r.restaurantName,
        itemsLabel: r.itemsLabel,
      })),
    });

    const menuItemIdsByRestaurant = buildMenuItemIdsByRestaurant(ctx.restaurants);
    const slotLabel = `${input.slotDate}/${mealType.key}`;

    const { result: rows } = await callLLMWithRetries(
      'reroll',
      prompt,
      (rawText) => {
        const out = parseLLMJson(rawText, aiSlotRerollOutputSchema);
        return validateSlotOptions(slotLabel, out.options, menuItemIdsByRestaurant).map(
          (optionRow) => ({
            generationId,
            slotDate: input.slotDate,
            mealTypeId: input.mealTypeId,
            ...optionRow,
          }),
        );
      },
      { operation: 'slot_reroll', userId, budgetPlanId: planId, generationId },
    );

    await db.transaction(async (tx) => {
      await mealPlanRepository.insertSlotReroll(
        {
          budgetPlanId: planId,
          generationId,
          slotDate: input.slotDate,
          mealTypeId: input.mealTypeId,
          rejectedOptions: newlyRejected,
        },
        tx,
      );
      await mealPlanRepository.deleteSuggestionsForSlot(
        generationId,
        input.slotDate,
        input.mealTypeId,
        tx,
      );
      await mealPlanRepository.insertSuggestions(rows, tx);
    });

    // Read back through the standard query so the response carries the same
    // hydrated shape (restaurant/menu item names) as GET /suggestions.
    const fresh = await mealPlanRepository.getSuggestionsForSlot(
      generationId,
      input.slotDate,
      input.mealTypeId,
    );

    return {
      date: input.slotDate,
      slot: {
        mealTypeId: input.mealTypeId,
        mealTypeKey: mealType.key,
        mealTypeLabel: mealType.label,
        options: fresh.map(toOption),
      },
      rerollsRemaining: Math.max(0, maxRerolls - usedRerolls - 1),
    };
  },

  /**
   * Fire-and-forget wrapper used after plan creation when
   * AUTO_GENERATE_ON_CREATE=true. Never throws — failures are logged so the
   * triggering request can still complete successfully.
   */
  kickoffGenerationAsync(userId: string, planId: string): void {
    void this.generate(userId, planId).catch((err) => {
      console.error(`[mealGenerationService] auto-generate failed for plan=${planId}`, err);
    });
  },

  /**
   * Fire-and-forget wrapper used after a meal choice when cumulative
   * deviation crosses the configured threshold. Never throws.
   */
  kickoffReplanAsync(userId: string, planId: string, triggerSummary: string): void {
    void this.replan(userId, planId, triggerSummary).catch((err) => {
      console.error(`[mealGenerationService] auto-replan failed for plan=${planId}`, err);
    });
  },
};

// ─── Internals ──────────────────────────────────────────────────────────────

async function assertPlanOwnership(userId: string, planId: string): Promise<void> {
  const plan = await budgetPlanRepository.findById(planId);
  if (!plan) throw new AppError(404, 'Budget plan not found', 'NOT_FOUND');
  if (plan.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
}

interface RunArgs {
  planId: string;
  userId: string;
  ctx: MealPlannerContext;
  prompt: string;
  mode: 'generate' | 'replan';
}

/**
 * Insert the pending row up-front (superseding any prior pending attempt, so a
 * newer kickoff wins) and hand the LLM call to the background, returning as soon
 * as the row exists. The detached promise runs to completion on a long-lived
 * process; a restart mid-flight is reconciled by the 5-minute pending-generation
 * janitor (see budget-plan.service).
 */
async function startGeneration(args: RunArgs): Promise<GenerationKickoff> {
  const generation = await mealPlanRepository.createGenerationSupersedingPrior(args.planId);

  // Fire-and-forget. executeGeneration writes failures to the row rather than
  // rethrowing; this .catch only guards against an unexpected throw.
  void executeGeneration(generation.id, args).catch((err) => {
    console.error(
      `[mealGenerationService:${args.mode}] background generation crashed for plan=${args.planId}`,
      err,
    );
  });

  return {
    generationId: generation.id,
    budgetPlanId: args.planId,
    generatedAt: generation.generatedAt,
  };
}

/**
 * Background half: call the LLM (with the retry-on-validation loop), then
 * persist suggestions + flip status atomically. Detached from the request, so
 * it NEVER rethrows — failures are written to the row via markGenerationFailed
 * for the FE to poll, and a superseded attempt is a silent no-op.
 */
async function executeGeneration(
  generationId: string,
  { planId, userId, ctx, prompt, mode }: RunArgs,
): Promise<void> {
  const startedAt = Date.now();

  try {
    // ─── 1. Build context lookups ───────────────────────────────────────────
    const mealTypes = await mealTypeRepository.listActive();
    const validators: ContextValidators = {
      mealTypeKeyToId: new Map(mealTypes.map((m) => [m.key, m.id] as const)),
      restaurantIds: new Set(ctx.restaurants.map((r) => r.restaurantId)),
      menuItemIdsByRestaurant: buildMenuItemIdsByRestaurant(ctx.restaurants),
      remainingDates: new Set(ctx.remainingDates),
      // Defense in depth: even though the prompt instructs the model not to
      // generate for pinned (date, mealType) cells, drop any rows that match
      // before persisting. The read path always favors pins anyway, but
      // dropping here keeps the suggestion table free of dead rows.
      pinnedSlotKeys: new Set(ctx.pinnedSlots.map((p) => `${p.slotDate}|${p.mealTypeId}`)),
    };

    // ─── 2. Call the LLM with the shared retry-on-validation-failure loop ───
    const { result, response } = await callLLMWithRetries(
      mode,
      prompt,
      (rawText) => parseAndValidate(rawText, generationId, validators),
      {
        operation: mode === 'generate' ? 'plan_generate' : 'plan_replan',
        userId,
        budgetPlanId: planId,
        generationId,
      },
    );
    const { plan, rows } = result;

    // ─── 3. Persist suggestions + flip status='succeeded' atomically ────────
    // The conditional mark inside the same tx is what makes supersede-on-kickoff
    // safe: if a newer kickoff flipped this row to 'superseded' while we were
    // calling the LLM, markGenerationSucceeded affects 0 rows and we throw
    // SupersededError to roll the suggestion insert back. No orphan rows.
    await db.transaction(async (tx) => {
      await mealPlanRepository.insertSuggestions(rows, tx);
      const applied = await mealPlanRepository.markGenerationSucceeded(generationId, tx);
      if (!applied) throw new SupersededError();
    });

    // ─── 4. Structured log ──────────────────────────────────────────────────
    const latencyMs = Date.now() - startedAt;
    console.info(
      `[mealGenerationService:${mode}] success`,
      JSON.stringify({
        planId,
        generationId,
        provider: response.provider,
        model: response.model,
        inputTokens: response.inputTokens ?? null,
        outputTokens: response.outputTokens ?? null,
        slotCount: plan.slots.length,
        suggestionCount: rows.length,
        suggestionItemCount: rows.reduce((n, r) => n + r.items.length, 0),
        estimatedTotalCost: plan.estimatedTotalCost,
        latencyMs,
      }),
    );
  } catch (err) {
    if (err instanceof SupersededError) {
      console.info(
        `[mealGenerationService:${mode}] generation=${generationId} superseded mid-flight; result dropped`,
      );
      return;
    }

    // Detached, so persist the failure instead of rethrowing — FE polling sees
    // the flip. Conditional WHERE status='pending' so we never clobber a
    // 'superseded' marker from a newer kickoff.
    const errorCode = err instanceof AppError && err.code ? err.code : 'AI_GENERATION_FAILED';
    const errorMessage = err instanceof Error ? err.message : null;
    try {
      await mealPlanRepository.markGenerationFailed(generationId, errorCode, errorMessage);
    } catch (markErr) {
      // Logging only — never let a marker write hide the original error.
      console.error(
        `[mealGenerationService:${mode}] markGenerationFailed for generation=${generationId} threw`,
        markErr,
      );
    }
  }
}

/**
 * Per-restaurant menu-item id sets so the validator can enforce that every
 * item inside a combo belongs to the option's restaurant — not just that the
 * id exists somewhere in the catalogue.
 */
function buildMenuItemIdsByRestaurant(
  restaurants: NearbyRestaurantContext[],
): Map<string, Set<string>> {
  const byRestaurant = new Map<string, Set<string>>();
  for (const r of restaurants) {
    byRestaurant.set(r.restaurantId, new Set(r.menuItems.map((i) => i.menuItemId)));
  }
  return byRestaurant;
}

/**
 * Strip Markdown code fences (```json ... ```), in case the model wraps its
 * JSON despite the system prompt asking it not to.
 */
function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

interface ContextValidators {
  mealTypeKeyToId: Map<string, string>;
  restaurantIds: Set<string>;
  menuItemIdsByRestaurant: Map<string, Set<string>>;
  remainingDates: Set<string>;
  /** "{slotDate}|{mealTypeId}" — slots the user has pinned; AI suggestions for these are dropped. */
  pinnedSlotKeys: Set<string>;
}

/** Single LLM call with the standard generation knobs. */
async function callLLM(messages: LLMMessage[], maxTokens: number): Promise<LLMResponse> {
  return llm.complete(messages, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: getGenerationTemperature(),
    maxTokens,
    jsonMode: true,
  });
}

/** Identifies the logical operation an attempt belongs to in ai_call_log. */
interface AICallContext {
  operation: 'plan_generate' | 'plan_replan' | 'slot_reroll';
  userId: string;
  budgetPlanId: string;
  generationId: string;
}

/**
 * Shared retry-on-validation-failure loop around `callLLM`. Each retry replays
 * the original prompt + the previous (invalid) response + a fresh user turn
 * that quotes the validator's complaint (a thrown `RetriableLLMError`), letting
 * the model self-correct UUIDs / keys / dates instead of failing the call.
 * Truncation (finishReason='length') gets its own retry path with a higher
 * token budget so we don't loop on impossible budgets. Exhausted attempts and
 * provider failures surface as `AppError(502)`.
 *
 * Every attempt — including the ones that get retried — writes one
 * ai_call_log row (fire-and-forget) with tokens, latency, and the outcome.
 */
async function callLLMWithRetries<T>(
  logTag: string,
  prompt: string,
  parse: (rawText: string) => T,
  callCtx: AICallContext,
): Promise<{ result: T; response: LLMResponse }> {
  const maxRetries = getGenerationMaxRetries();
  const baseUserTurn: LLMMessage = { role: 'user', content: prompt };
  let messages: LLMMessage[] = [baseUserTurn];
  let maxTokens = getGenerationMaxTokens();

  const logAttempt = (
    attempt: number,
    latencyMs: number,
    status: AICallLogEntry['status'],
    response: LLMResponse | null,
    error?: { code?: string; message?: string },
  ): void =>
    logAICall({
      ...callCtx,
      provider: response?.provider ?? llm.name,
      model: response?.model ?? llm.defaultModel,
      status,
      attempt,
      inputTokens: response?.inputTokens ?? null,
      outputTokens: response?.outputTokens ?? null,
      latencyMs,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
    });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const isLastAttempt = attempt === maxRetries;
    const attemptStartedAt = Date.now();
    let response: LLMResponse;
    try {
      response = await callLLM(messages, maxTokens);
    } catch (err) {
      logAttempt(attempt + 1, Date.now() - attemptStartedAt, 'provider_error', null, {
        code: 'AI_PROVIDER_ERROR',
        message: err instanceof Error ? err.message : String(err),
      });
      console.error(
        `[mealGenerationService:${logTag}] llm.complete failed (attempt ${attempt + 1}/${maxRetries + 1})`,
        err,
      );
      // Provider errors (network, 5xx upstream, auth) aren't recovered by
      // re-asking with feedback — bail immediately.
      throw new AppError(502, 'AI provider failed', 'AI_PROVIDER_ERROR', { cause: err });
    }
    const latencyMs = Date.now() - attemptStartedAt;

    if (response.finishReason === 'length') {
      logAttempt(attempt + 1, latencyMs, 'truncated', response, {
        code: 'AI_RESPONSE_TRUNCATED',
        message: `max_tokens=${maxTokens} reached`,
      });
      if (isLastAttempt) {
        throw new AppError(502, 'AI response truncated by token limit', 'AI_RESPONSE_TRUNCATED', {
          cause: new Error(`max_tokens=${maxTokens} reached`),
        });
      }
      const nextMaxTokens = Math.ceil(maxTokens * TRUNCATION_TOKEN_MULTIPLIER);
      console.warn(
        `[mealGenerationService:${logTag}] response truncated (attempt ${attempt + 1}, max_tokens=${maxTokens}); retrying with max_tokens=${nextMaxTokens}`,
      );
      maxTokens = nextMaxTokens;
      // Replay from the original prompt — we don't ask the model to "continue"
      // a partial JSON, the next call should produce a fresh complete object.
      messages = [baseUserTurn];
      continue;
    }

    try {
      const result = parse(response.text);
      logAttempt(attempt + 1, latencyMs, 'succeeded', response);
      return { result, response };
    } catch (err) {
      logAttempt(attempt + 1, latencyMs, 'validation_failed', response, {
        message: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof RetriableLLMError && !isLastAttempt) {
        console.warn(
          `[mealGenerationService:${logTag}] validation failed (attempt ${attempt + 1}/${maxRetries + 1}); retrying with feedback: ${err.feedback}`,
        );
        messages = [
          baseUserTurn,
          { role: 'assistant', content: response.text },
          { role: 'user', content: buildRetryUserTurn(err.feedback) },
        ];
        continue;
      }
      const preview = response.text.slice(0, 500);
      console.error(
        `[mealGenerationService:${logTag}] failed to validate LLM output after ${attempt + 1} attempt(s). preview=${preview}`,
        err,
      );
      if (err instanceof AppError) throw err;
      const message =
        err instanceof RetriableLLMError ? err.feedback : 'AI returned invalid output';
      throw new AppError(502, message, 'AI_GENERATION_FAILED', { cause: err });
    }
  }

  // Defensive: the loop above only exits via `return` or `throw`.
  throw new AppError(502, 'AI generation produced no result', 'AI_GENERATION_FAILED');
}

/**
 * Parse raw LLM text (fences stripped) as JSON and validate it against a Zod
 * schema, translating any failure into a `RetriableLLMError` whose feedback
 * gets replayed to the model by `callLLMWithRetries`.
 */
function parseLLMJson<T>(rawText: string, schema: ZodType<T>): T {
  try {
    return schema.parse(JSON.parse(stripFences(rawText)));
  } catch (err) {
    const detail =
      err instanceof ZodError
        ? err.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`).join('; ')
        : err instanceof SyntaxError
          ? `JSON parse failed: ${err.message}`
          : 'unknown parse error';
    throw new RetriableLLMError(
      'LLM output did not match the required schema',
      `Your previous response could not be parsed. Problems: ${detail}. Reply with the COMPLETE JSON object, no prose, no code fences, exactly matching the schema in the original instructions.`,
      { cause: err instanceof Error ? err : undefined },
    );
  }
}

/**
 * Parse the raw LLM text → JSON → AIPlanOutput, then cross-check every slot
 * and option against the active plan context. On any recoverable mismatch,
 * throws a `RetriableLLMError` whose `feedback` will be replayed to the model.
 *
 * Returns both the parsed plan and the DB rows ready to insert so the caller
 * doesn't iterate the slots twice.
 */
function parseAndValidate(
  rawText: string,
  generationId: string,
  validators: ContextValidators,
): { plan: AIPlanOutput; rows: NewMealSuggestionWithItems[] } {
  const plan = parseLLMJson(rawText, aiPlanOutputSchema);

  const rows: NewMealSuggestionWithItems[] = [];
  for (const slot of plan.slots) {
    const mealTypeId = validators.mealTypeKeyToId.get(slot.mealTypeKey);
    if (!mealTypeId) {
      throw new RetriableLLMError(
        `unknown mealTypeKey "${slot.mealTypeKey}"`,
        `Slot ${slot.slotDate}/${slot.mealTypeKey}: mealTypeKey "${slot.mealTypeKey}" is not one of the allowed keys. Use only the lowercase keys listed in the prompt under "Meal type keys".`,
      );
    }
    if (!validators.remainingDates.has(slot.slotDate)) {
      throw new RetriableLLMError(
        `slotDate "${slot.slotDate}" outside the remaining-dates window`,
        `Slot ${slot.slotDate}/${slot.mealTypeKey}: slotDate "${slot.slotDate}" is not in the remaining-dates window. Only use dates from the "Days to plan" / "Remaining dates" section.`,
      );
    }
    // Silently drop AI suggestions for pinned slots — the read path always
    // serves the pin instead, so persisting these would just be dead data.
    if (validators.pinnedSlotKeys.has(`${slot.slotDate}|${mealTypeId}`)) {
      continue;
    }

    const slotLabel = `${slot.slotDate}/${slot.mealTypeKey}`;
    for (const optionRow of validateSlotOptions(
      slotLabel,
      slot.options,
      validators.menuItemIdsByRestaurant,
    )) {
      rows.push({ generationId, slotDate: slot.slotDate, mealTypeId, ...optionRow });
    }
  }

  return { plan, rows };
}

/** A validated option shaped for insert, minus the slot-identity columns. */
type SlotOptionRow = Omit<NewMealSuggestionWithItems, 'generationId' | 'slotDate' | 'mealTypeId'>;

/**
 * Cross-check one slot's options against the ID catalogue (restaurant exists,
 * every item belongs to it, no duplicate indices/items) and shape them into
 * insert rows. Shared by the full-plan validator and the single-slot reroll;
 * `slotLabel` ("YYYY-MM-DD/lunch") only feeds the retry feedback strings.
 */
function validateSlotOptions(
  slotLabel: string,
  options: AIPlanOption[],
  menuItemIdsByRestaurant: Map<string, Set<string>>,
): SlotOptionRow[] {
  const rows: SlotOptionRow[] = [];
  const seenOptionIndices = new Set<number>();
  for (const opt of options) {
    if (seenOptionIndices.has(opt.optionIndex)) {
      throw new RetriableLLMError(
        `duplicate optionIndex ${opt.optionIndex} for ${slotLabel}`,
        `Slot ${slotLabel}: optionIndex ${opt.optionIndex} appears more than once. Each slot must have exactly 3 options with optionIndex 0, 1, and 2 (each used once).`,
      );
    }
    seenOptionIndices.add(opt.optionIndex);

    const restaurantItemIds = menuItemIdsByRestaurant.get(opt.restaurantId);
    if (!restaurantItemIds) {
      throw new RetriableLLMError(
        `unknown restaurantId ${opt.restaurantId}`,
        `Slot ${slotLabel} option ${opt.optionIndex}: restaurantId "${opt.restaurantId}" is not in the ID catalogue. Replace it with a restaurantId copied verbatim from the catalogue.`,
      );
    }

    const seenItemIds = new Set<string>();
    for (const item of opt.items) {
      if (!restaurantItemIds.has(item.menuItemId)) {
        throw new RetriableLLMError(
          `menuItemId ${item.menuItemId} does not belong to restaurant ${opt.restaurantId}`,
          `Slot ${slotLabel} option ${opt.optionIndex}: menuItemId "${item.menuItemId}" does not appear under restaurantId "${opt.restaurantId}" in the ID catalogue. Every item in an option must be listed under that option's restaurant — replace it with a menuItemId copied verbatim from that restaurant's entries.`,
        );
      }
      if (seenItemIds.has(item.menuItemId)) {
        throw new RetriableLLMError(
          `duplicate menuItemId ${item.menuItemId} in ${slotLabel} option ${opt.optionIndex}`,
          `Slot ${slotLabel} option ${opt.optionIndex}: menuItemId "${item.menuItemId}" appears more than once in the same order. List each menu item at most once per option.`,
        );
      }
      seenItemIds.add(item.menuItemId);
    }

    const comboTotal = opt.items.reduce((sum, item) => sum + item.estimatedPrice, 0);

    rows.push({
      optionIndex: opt.optionIndex,
      restaurantId: opt.restaurantId,
      estimatedPrice: comboTotal.toFixed(2),
      notes: opt.notes ?? null,
      items: opt.items.map((item, itemIndex) => ({
        itemIndex,
        menuItemId: item.menuItemId,
        estimatedPrice: item.estimatedPrice.toFixed(2),
      })),
    });
  }
  return rows;
}

/**
 * Wraps validator feedback in a brief instruction the model can act on. Kept
 * small intentionally — the original prompt (with full restaurant/ID data) is
 * still in the conversation, so we don't restate it.
 */
function buildRetryUserTurn(feedback: string): string {
  return `The JSON you returned is invalid. ${feedback}

Return the corrected COMPLETE JSON object now. No prose, no code fences. Use only IDs from the original ID catalogue.`;
}
