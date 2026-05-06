import {
  budgetPlanRepository,
  db,
  mealPlanRepository,
  mealTypeRepository,
} from '@repo/database';
import type { NewMealSuggestion } from '@repo/database';
import {
  aiPlanOutputSchema,
  type AIPlanOutput,
  type LLMMessage,
  type LLMResponse,
  type MealPlannerContext,
  type NearbyRestaurantContext,
} from '@repo/shared';
import { ZodError } from 'zod';
import {
  SYSTEM_PROMPT,
  buildGeneratePlanPrompt,
  buildReplanPrompt,
} from '@repo/ai/prompts';

import { AppError } from '../middleware/error.middleware.js';
import { llm } from '../lib/llm.js';
import { contextBuilderService } from './context-builder.service.js';

export interface GenerationResult {
  generationId: string;
  budgetPlanId: string;
  generatedAt: Date;
  suggestionCount: number;
  planSummary: string;
  estimatedTotalCost: number;
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
 * Two synchronous entry points (`generate`, `replan`) throw AppError on
 * failure so HTTP handlers can return a meaningful 502. Two async fire-and-
 * forget wrappers (`kickoffGenerationAsync`, `kickoffReplanAsync`) swallow and
 * log errors so they can be safely chained from non-AI request paths
 * (plan create, meal-choice record).
 */
export const mealGenerationService = {
  /**
   * Synchronous entry: throws on real failures (mapped to HTTP 502 by the
   * route). Returns `null` when this attempt was superseded mid-flight by a
   * newer kickoff — caller should treat as a no-op (HTTP 202).
   */
  async generate(userId: string, planId: string): Promise<GenerationResult | null> {
    await assertPlanOwnership(userId, planId);
    const ctx = await contextBuilderService.build(planId, userId);

    if (ctx.remainingDates.length === 0) {
      throw new AppError(
        400,
        'No remaining dates to plan for',
        'NO_REMAINING_DATES',
      );
    }
    if (ctx.restaurants.length === 0) {
      throw new AppError(
        400,
        'No nearby restaurants available for this user',
        'NO_NEARBY_RESTAURANTS',
      );
    }

    const prompt = buildGeneratePlanPrompt(ctx);
    return runGeneration({ planId, ctx, prompt, mode: 'generate' });
  },

  async replan(
    userId: string,
    planId: string,
    triggerSummary: string,
  ): Promise<GenerationResult | null> {
    await assertPlanOwnership(userId, planId);
    const ctx = await contextBuilderService.build(planId, userId);

    if (ctx.remainingDates.length === 0) {
      throw new AppError(
        400,
        'No remaining dates to replan for',
        'NO_REMAINING_DATES',
      );
    }
    if (ctx.restaurants.length === 0) {
      throw new AppError(
        400,
        'No nearby restaurants available for this user',
        'NO_NEARBY_RESTAURANTS',
      );
    }

    const prompt = buildReplanPrompt(ctx, triggerSummary);
    return runGeneration({ planId, ctx, prompt, mode: 'replan' });
  },

  /**
   * Fire-and-forget wrapper used after plan creation when
   * AUTO_GENERATE_ON_CREATE=true. Never throws — failures are logged so the
   * triggering request can still complete successfully.
   */
  kickoffGenerationAsync(userId: string, planId: string): void {
    void this.generate(userId, planId).catch((err) => {
      console.error(
        `[mealGenerationService] auto-generate failed for plan=${planId}`,
        err,
      );
    });
  },

  /**
   * Fire-and-forget wrapper used after a meal choice when cumulative
   * deviation crosses the configured threshold. Never throws.
   */
  kickoffReplanAsync(userId: string, planId: string, triggerSummary: string): void {
    void this.replan(userId, planId, triggerSummary).catch((err) => {
      console.error(
        `[mealGenerationService] auto-replan failed for plan=${planId}`,
        err,
      );
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
  ctx: MealPlannerContext;
  prompt: string;
  mode: 'generate' | 'replan';
}

async function runGeneration({
  planId,
  ctx,
  prompt,
  mode,
}: RunArgs): Promise<GenerationResult | null> {
  const startedAt = Date.now();

  // ─── 0. Insert pending row up-front, supersede any prior pending ──────────
  // Doing this BEFORE the LLM call gives the FE a queryable status the moment
  // a kickoff begins, and the supersede write makes a newer kickoff for the
  // same plan win automatically — older in-flight LLM calls discard their
  // results via the conditional success/fail markers below.
  const generation = await mealPlanRepository.createGenerationSupersedingPrior(planId);

  try {
    // ─── 1. Build context lookups ───────────────────────────────────────────
    const mealTypes = await mealTypeRepository.listActive();
    const validators: ContextValidators = {
      mealTypeKeyToId: new Map(mealTypes.map((m) => [m.key, m.id] as const)),
      restaurantIds: new Set(ctx.restaurants.map((r) => r.restaurantId)),
      menuItemIds: buildMenuItemIdSet(ctx.restaurants),
      remainingDates: new Set(ctx.remainingDates),
    };

    // ─── 2. Call the LLM with a retry-on-validation-failure loop ───────────
    // Each retry replays the original prompt + the previous (invalid) response
    // + a fresh user turn that quotes the validator's complaint, letting the
    // model self-correct UUIDs / mealTypeKeys / dates instead of failing the
    // whole generation. Truncation (finishReason='length') gets its own retry
    // path with a higher token budget so we don't loop on impossible budgets.
    const maxRetries = getGenerationMaxRetries();
    const baseUserTurn: LLMMessage = { role: 'user', content: prompt };
    let messages: LLMMessage[] = [baseUserTurn];
    let maxTokens = getGenerationMaxTokens();
    let plan: AIPlanOutput | null = null;
    let rows: NewMealSuggestion[] = [];
    let response: LLMResponse | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const isLastAttempt = attempt === maxRetries;
      try {
        response = await callLLM(messages, maxTokens);
      } catch (err) {
        console.error(
          `[mealGenerationService:${mode}] llm.complete failed (attempt ${attempt + 1}/${maxRetries + 1})`,
          err,
        );
        // Provider errors (network, 5xx upstream, auth) aren't recovered by
        // re-asking with feedback — bail immediately.
        throw new AppError(502, 'AI provider failed', 'AI_PROVIDER_ERROR', { cause: err });
      }

      if (response.finishReason === 'length') {
        if (isLastAttempt) {
          throw new AppError(
            502,
            'AI response truncated by token limit',
            'AI_RESPONSE_TRUNCATED',
            { cause: new Error(`max_tokens=${maxTokens} reached`) },
          );
        }
        const nextMaxTokens = Math.ceil(maxTokens * TRUNCATION_TOKEN_MULTIPLIER);
        console.warn(
          `[mealGenerationService:${mode}] response truncated (attempt ${attempt + 1}, max_tokens=${maxTokens}); retrying with max_tokens=${nextMaxTokens}`,
        );
        maxTokens = nextMaxTokens;
        // Replay from the original prompt — we don't ask the model to "continue"
        // a partial JSON, the next call should produce a fresh complete object.
        messages = [baseUserTurn];
        continue;
      }

      try {
        const validated = parseAndValidate(response.text, generation.id, validators);
        plan = validated.plan;
        rows = validated.rows;
        break;
      } catch (err) {
        if (err instanceof RetriableLLMError && !isLastAttempt) {
          console.warn(
            `[mealGenerationService:${mode}] validation failed (attempt ${attempt + 1}/${maxRetries + 1}); retrying with feedback: ${err.feedback}`,
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
          `[mealGenerationService:${mode}] failed to validate LLM output after ${attempt + 1} attempt(s). preview=${preview}`,
          err,
        );
        if (err instanceof AppError) throw err;
        const message =
          err instanceof RetriableLLMError ? err.feedback : 'AI returned invalid output';
        throw new AppError(502, message, 'AI_GENERATION_FAILED', { cause: err });
      }
    }

    if (!plan || !response) {
      // Defensive: the loop above only exits via `break` (success) or `throw`.
      throw new AppError(502, 'AI generation produced no result', 'AI_GENERATION_FAILED');
    }

    // ─── 3. Persist suggestions + flip status='succeeded' atomically ────────
    // The conditional mark inside the same tx is what makes supersede-on-kickoff
    // safe: if a newer kickoff flipped this row to 'superseded' while we were
    // calling the LLM, markGenerationSucceeded affects 0 rows and we throw
    // SupersededError to roll the suggestion insert back. No orphan rows.
    await db.transaction(async (tx) => {
      await mealPlanRepository.insertSuggestions(rows, tx);
      const applied = await mealPlanRepository.markGenerationSucceeded(generation.id, tx);
      if (!applied) throw new SupersededError();
    });

    // ─── 4. Structured log ──────────────────────────────────────────────────
    const latencyMs = Date.now() - startedAt;
    console.info(
      `[mealGenerationService:${mode}] success`,
      JSON.stringify({
        planId,
        generationId: generation.id,
        provider: response.provider,
        model: response.model,
        inputTokens: response.inputTokens ?? null,
        outputTokens: response.outputTokens ?? null,
        slotCount: plan.slots.length,
        suggestionCount: rows.length,
        estimatedTotalCost: plan.estimatedTotalCost,
        latencyMs,
      }),
    );

    return {
      generationId: generation.id,
      budgetPlanId: planId,
      generatedAt: generation.generatedAt,
      suggestionCount: rows.length,
      planSummary: plan.planSummary,
      estimatedTotalCost: plan.estimatedTotalCost,
    };
  } catch (err) {
    if (err instanceof SupersededError) {
      console.info(
        `[mealGenerationService:${mode}] generation=${generation.id} superseded mid-flight; result dropped`,
      );
      return null;
    }

    // Mark the row as failed before re-throwing so the FE polling sees the
    // status flip on its next tick. Conditional WHERE status='pending' so we
    // never overwrite a 'superseded' marker (e.g. if a newer kickoff arrived
    // between the LLM error and this update).
    const errorCode = err instanceof AppError && err.code ? err.code : 'AI_GENERATION_FAILED';
    const errorMessage = err instanceof Error ? err.message : null;
    try {
      await mealPlanRepository.markGenerationFailed(generation.id, errorCode, errorMessage);
    } catch (markErr) {
      // Logging only — never let a marker write hide the original error.
      console.error(
        `[mealGenerationService:${mode}] markGenerationFailed for generation=${generation.id} threw`,
        markErr,
      );
    }

    throw err;
  }
}

function buildMenuItemIdSet(restaurants: NearbyRestaurantContext[]): Set<string> {
  const ids = new Set<string>();
  for (const r of restaurants) {
    for (const item of r.menuItems) ids.add(item.menuItemId);
  }
  return ids;
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
  menuItemIds: Set<string>;
  remainingDates: Set<string>;
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
): { plan: AIPlanOutput; rows: NewMealSuggestion[] } {
  let plan: AIPlanOutput;
  try {
    plan = aiPlanOutputSchema.parse(JSON.parse(stripFences(rawText)));
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

  const rows: NewMealSuggestion[] = [];
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

    const seenOptionIndices = new Set<number>();
    for (const opt of slot.options) {
      if (seenOptionIndices.has(opt.optionIndex)) {
        throw new RetriableLLMError(
          `duplicate optionIndex ${opt.optionIndex} for ${slot.slotDate}/${slot.mealTypeKey}`,
          `Slot ${slot.slotDate}/${slot.mealTypeKey}: optionIndex ${opt.optionIndex} appears more than once. Each slot must have exactly 3 options with optionIndex 0, 1, and 2 (each used once).`,
        );
      }
      seenOptionIndices.add(opt.optionIndex);

      if (!validators.restaurantIds.has(opt.restaurantId)) {
        throw new RetriableLLMError(
          `unknown restaurantId ${opt.restaurantId}`,
          `Slot ${slot.slotDate}/${slot.mealTypeKey} option ${opt.optionIndex}: restaurantId "${opt.restaurantId}" is not in the ID catalogue. Replace it with a restaurantId copied verbatim from the catalogue.`,
        );
      }
      if (!validators.menuItemIds.has(opt.menuItemId)) {
        throw new RetriableLLMError(
          `unknown menuItemId ${opt.menuItemId}`,
          `Slot ${slot.slotDate}/${slot.mealTypeKey} option ${opt.optionIndex}: menuItemId "${opt.menuItemId}" is not in the ID catalogue. Replace it with a menuItemId that appears under restaurantId "${opt.restaurantId}".`,
        );
      }

      rows.push({
        generationId,
        slotDate: slot.slotDate,
        mealTypeId,
        optionIndex: opt.optionIndex,
        restaurantId: opt.restaurantId,
        menuItemId: opt.menuItemId,
        estimatedPrice: opt.estimatedPrice.toFixed(2),
        notes: opt.notes ?? null,
      });
    }
  }

  return { plan, rows };
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
