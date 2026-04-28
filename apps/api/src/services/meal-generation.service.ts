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
  type MealPlannerContext,
  type NearbyRestaurantContext,
} from '@repo/shared';
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

const DEFAULT_GENERATION_TEMPERATURE = 0.3;
const DEFAULT_GENERATION_MAX_TOKENS = 8192;

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
  async generate(userId: string, planId: string): Promise<GenerationResult> {
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
  ): Promise<GenerationResult> {
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
}: RunArgs): Promise<GenerationResult> {
  const startedAt = Date.now();

  // ─── 1. Call the LLM ──────────────────────────────────────────────────────
  let response: Awaited<ReturnType<typeof llm.complete>>;
  try {
    response = await llm.complete(
      [{ role: 'user', content: prompt }],
      {
        systemPrompt: SYSTEM_PROMPT,
        temperature: getGenerationTemperature(),
        maxTokens: getGenerationMaxTokens(),
      },
    );
  } catch (err) {
    console.error(`[mealGenerationService:${mode}] llm.complete failed`, err);
    throw new AppError(502, 'AI provider failed', 'AI_PROVIDER_ERROR', { cause: err });
  }

  // ─── 2. Parse + Zod validate the response ─────────────────────────────────
  let parsed: AIPlanOutput;
  try {
    parsed = aiPlanOutputSchema.parse(JSON.parse(stripFences(response.text)));
  } catch (err) {
    console.error(
      `[mealGenerationService:${mode}] failed to parse LLM output. preview=${response.text.slice(0, 500)}`,
      err,
    );
    throw new AppError(502, 'AI returned invalid output', 'AI_GENERATION_FAILED', {
      cause: err,
    });
  }

  // ─── 3. Build lookup maps from active context ─────────────────────────────
  const mealTypes = await mealTypeRepository.listActive();
  const mealTypeKeyToId = new Map(mealTypes.map((m) => [m.key, m.id] as const));
  const restaurantIds = new Set(ctx.restaurants.map((r) => r.restaurantId));
  const menuItemIds = buildMenuItemIdSet(ctx.restaurants);
  const remainingDates = new Set(ctx.remainingDates);

  // ─── 4. Cross-validate every slot/option against context ──────────────────
  const rows: NewMealSuggestion[] = [];
  for (const slot of parsed.slots) {
    const mealTypeId = mealTypeKeyToId.get(slot.mealTypeKey);
    if (!mealTypeId) {
      throw new AppError(
        502,
        `AI returned unknown mealTypeKey "${slot.mealTypeKey}"`,
        'AI_GENERATION_FAILED',
      );
    }
    if (!remainingDates.has(slot.slotDate)) {
      throw new AppError(
        502,
        `AI returned slotDate "${slot.slotDate}" outside the remaining-dates window`,
        'AI_GENERATION_FAILED',
      );
    }

    const seenOptionIndices = new Set<number>();
    for (const opt of slot.options) {
      if (seenOptionIndices.has(opt.optionIndex)) {
        throw new AppError(
          502,
          `AI returned duplicate optionIndex ${opt.optionIndex} for ${slot.slotDate}/${slot.mealTypeKey}`,
          'AI_GENERATION_FAILED',
        );
      }
      seenOptionIndices.add(opt.optionIndex);

      if (!restaurantIds.has(opt.restaurantId)) {
        throw new AppError(
          502,
          `AI referenced restaurantId "${opt.restaurantId}" not in provided context`,
          'AI_GENERATION_FAILED',
        );
      }
      if (!menuItemIds.has(opt.menuItemId)) {
        throw new AppError(
          502,
          `AI referenced menuItemId "${opt.menuItemId}" not in provided context`,
          'AI_GENERATION_FAILED',
        );
      }

      rows.push({
        // generationId is filled in transaction below once we have it
        generationId: '__placeholder__',
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

  // ─── 5. Persist generation + suggestions atomically ───────────────────────
  const generation = await db.transaction(async (tx) => {
    const gen = await mealPlanRepository.createGeneration(planId, tx);
    const withGenerationId = rows.map((r) => ({ ...r, generationId: gen.id }));
    await mealPlanRepository.insertSuggestions(withGenerationId, tx);
    return gen;
  });

  // ─── 6. Structured log ────────────────────────────────────────────────────
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
      slotCount: parsed.slots.length,
      suggestionCount: rows.length,
      estimatedTotalCost: parsed.estimatedTotalCost,
      latencyMs,
    }),
  );

  return {
    generationId: generation.id,
    budgetPlanId: planId,
    generatedAt: generation.generatedAt,
    suggestionCount: rows.length,
    planSummary: parsed.planSummary,
    estimatedTotalCost: parsed.estimatedTotalCost,
  };
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
