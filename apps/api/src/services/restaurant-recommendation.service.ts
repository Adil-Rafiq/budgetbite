import type {
  CreateRestaurantRecommendationInput,
  ExtractedMenuResponse,
  ExtractMenuFromImageInput,
  LLMResponse,
  ListRestaurantRecommendationsQuery,
  MenuImageMimeType,
  RecommendationStatus,
  RecommendationItemInput,
  ReviewRestaurantRecommendationInput,
} from '@repo/shared';
import {
  aiMenuExtractionOutputSchema,
  MAX_PENDING_RESTAURANT_RECOMMENDATIONS,
  MAX_RECOMMENDATION_ITEMS,
  MENU_IMAGE_MAX_BYTES,
  recommendationItemInputSchema,
} from '@repo/shared';
import {
  restaurantRecommendationRepository,
  type AdminRecommendationRow,
  type RestaurantRecommendation,
} from '@repo/database';
import { buildMenuExtractionPrompt, MENU_EXTRACTION_SYSTEM_PROMPT } from '@repo/ai/prompts';

import { AppError } from '../middleware/error.middleware.js';
import { logAICall } from '../lib/ai-log.js';
import { llm } from '../lib/llm.js';
import { auditService } from './audit.service.js';
import type { AuditActor } from '../lib/audit-actor.js';

function toResponse(rec: RestaurantRecommendation) {
  return {
    id: rec.id,
    name: rec.name,
    link: rec.link,
    phone: rec.phone,
    area: rec.area,
    note: rec.note,
    items: (rec.items ?? []).map((i) => ({
      name: i.name,
      price: i.price,
      description: i.description ?? null,
    })),
    latitude: rec.latitude != null ? Number(rec.latitude) : null,
    longitude: rec.longitude != null ? Number(rec.longitude) : null,
    status: rec.status as RecommendationStatus,
    adminNote: rec.adminNote,
    createdRestaurantId: rec.createdRestaurantId,
    reviewedAt: rec.reviewedAt,
    createdAt: rec.createdAt,
  };
}

function toAdminResponse(row: AdminRecommendationRow) {
  return { ...toResponse(row), user: row.user };
}

/** Collapse duplicate item names (menu_item is unique per restaurant+name). */
function dedupeItems(
  items: { name: string; price: number; description?: string | null }[],
): { name: string; price: number; description: string | null }[] {
  const map = new Map<string, { name: string; price: number; description: string | null }>();
  for (const i of items) {
    map.set(i.name.trim().toLowerCase(), {
      name: i.name.trim(),
      price: i.price,
      description: i.description ?? null,
    });
  }
  return Array.from(map.values());
}

const MENU_EXTRACTION_MAX_TOKENS = 4096;

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** True when the decoded bytes actually start like the declared image format. */
function matchesMagicBytes(bytes: Buffer, mimeType: MenuImageMimeType): boolean {
  switch (mimeType) {
    case 'image/jpeg':
      return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case 'image/png':
      return (
        bytes.length > PNG_MAGIC.length && bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)
      );
    case 'image/webp':
      return (
        bytes.length > 12 &&
        bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
        bytes.subarray(8, 12).toString('ascii') === 'WEBP'
      );
  }
}

/**
 * The Zod schema already bounds the base64 form; this re-checks the exact
 * decoded size and sniffs magic bytes so a caller can't smuggle an arbitrary
 * payload (or an unsupported format) under an allowed mime type.
 */
function assertValidMenuImage(image: string, mimeType: MenuImageMimeType): void {
  const bytes = Buffer.from(image, 'base64');
  if (bytes.byteLength > MENU_IMAGE_MAX_BYTES) {
    throw new AppError(
      400,
      `Image is too large — the maximum is ${Math.floor(MENU_IMAGE_MAX_BYTES / (1024 * 1024))}MB.`,
      'IMAGE_TOO_LARGE',
    );
  }
  if (!matchesMagicBytes(bytes, mimeType)) {
    throw new AppError(
      400,
      'The uploaded file does not look like a supported image (JPEG, PNG, or WebP).',
      'INVALID_IMAGE',
    );
  }
}

/** Strip Markdown code fences in case the model wraps its JSON anyway. */
function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/**
 * Clamp and validate every extracted item against the same schema the submit
 * endpoint enforces, dropping the ones that don't survive — one garbled row
 * never fails the whole extraction. Dedupes by name (first occurrence wins)
 * and caps at MAX_RECOMMENDATION_ITEMS so the response always prefills a
 * submittable form. The foreign-currency flag rides along untouched (clamped)
 * so the client can warn that the price needs converting to PKR.
 */
function sanitizeExtractedItems(
  raw: {
    name: string;
    price: number;
    description?: string | null;
    foreignCurrency?: string | null;
  }[],
): (RecommendationItemInput & { foreignCurrency: string | null })[] {
  const items: (RecommendationItemInput & { foreignCurrency: string | null })[] = [];
  const seenNames = new Set<string>();
  for (const item of raw) {
    if (items.length >= MAX_RECOMMENDATION_ITEMS) break;
    const description = item.description?.trim().slice(0, 500);
    const parsed = recommendationItemInputSchema.safeParse({
      name: item.name.trim().slice(0, 200),
      price: item.price,
      ...(description ? { description } : {}),
    });
    if (!parsed.success) continue;
    const nameKey = parsed.data.name.toLowerCase();
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);
    items.push({
      ...parsed.data,
      foreignCurrency: item.foreignCurrency?.trim().slice(0, 10) || null,
    });
  }
  return items;
}

export const restaurantRecommendationService = {
  async submit(userId: string, input: CreateRestaurantRecommendationInput) {
    const pending = await restaurantRecommendationRepository.countPendingByUser(userId);
    if (pending >= MAX_PENDING_RESTAURANT_RECOMMENDATIONS) {
      throw new AppError(
        409,
        `You can have at most ${MAX_PENDING_RESTAURANT_RECOMMENDATIONS} recommendations awaiting review. Please wait for an admin to review your existing ones.`,
        'RECOMMENDATION_LIMIT',
      );
    }

    // The submitter pins the restaurant's own location (not their own), so the
    // admin knows exactly where it is and the restaurant is created there on
    // approval.
    const rec = await restaurantRecommendationRepository.create({
      userId,
      name: input.name,
      link: input.link ?? null,
      phone: input.phone ?? null,
      area: input.area ?? null,
      note: input.note ?? null,
      items: input.items.map((i) => ({
        name: i.name,
        price: i.price,
        description: i.description ?? null,
      })),
      latitude: String(input.latitude),
      longitude: String(input.longitude),
    });
    return toResponse(rec);
  },

  /**
   * Read menu items off a user-uploaded menu photo with the LLM so the web
   * form can be pre-filled. Guarded end-to-end: per-user rate limit (route),
   * the same pending-recommendation cap as submit (so the endpoint can't be
   * farmed as free OCR by users who couldn't submit anyway), decoded-size +
   * magic-byte validation, a hardened single-task prompt, a low token budget,
   * and strict sanitization of whatever comes back. Returns `{ items: [] }`
   * when the photo isn't a legible menu — the client falls back to manual
   * entry.
   */
  async extractMenuFromImage(
    userId: string,
    input: ExtractMenuFromImageInput,
  ): Promise<ExtractedMenuResponse> {
    const pending = await restaurantRecommendationRepository.countPendingByUser(userId);
    if (pending >= MAX_PENDING_RESTAURANT_RECOMMENDATIONS) {
      throw new AppError(
        409,
        `You can have at most ${MAX_PENDING_RESTAURANT_RECOMMENDATIONS} recommendations awaiting review. Please wait for an admin to review your existing ones.`,
        'RECOMMENDATION_LIMIT',
      );
    }

    assertValidMenuImage(input.image, input.mimeType);

    const startedAt = Date.now();
    let response: LLMResponse;
    try {
      response = await llm.complete(
        [
          {
            role: 'user',
            content: buildMenuExtractionPrompt(MAX_RECOMMENDATION_ITEMS),
            images: [{ data: input.image, mimeType: input.mimeType }],
          },
        ],
        {
          systemPrompt: MENU_EXTRACTION_SYSTEM_PROMPT,
          temperature: 0,
          maxTokens: MENU_EXTRACTION_MAX_TOKENS,
          jsonMode: true,
        },
      );
    } catch (err) {
      logAICall({
        operation: 'menu_extraction',
        userId,
        provider: llm.name,
        model: llm.defaultModel,
        status: 'provider_error',
        latencyMs: Date.now() - startedAt,
        errorCode: 'AI_PROVIDER_ERROR',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw new AppError(502, 'AI provider failed', 'AI_PROVIDER_ERROR', { cause: err });
    }
    const latencyMs = Date.now() - startedAt;
    const logOutcome = (
      status: 'succeeded' | 'validation_failed' | 'truncated',
      errorMessage?: string,
    ): void =>
      logAICall({
        operation: 'menu_extraction',
        userId,
        provider: response.provider,
        model: response.model,
        status,
        inputTokens: response.inputTokens ?? null,
        outputTokens: response.outputTokens ?? null,
        latencyMs,
        errorCode: status === 'succeeded' ? null : 'AI_EXTRACTION_FAILED',
        errorMessage: errorMessage ?? null,
      });

    if (response.finishReason === 'length') {
      logOutcome('truncated', `max_tokens=${MENU_EXTRACTION_MAX_TOKENS} reached`);
      throw new AppError(
        502,
        'The menu could not be read completely. Try a clearer photo, or add the items manually.',
        'AI_EXTRACTION_FAILED',
      );
    }

    let output;
    try {
      output = aiMenuExtractionOutputSchema.parse(JSON.parse(stripFences(response.text)));
    } catch (err) {
      logOutcome('validation_failed', err instanceof Error ? err.message : String(err));
      throw new AppError(
        502,
        'The menu photo could not be read. Try a clearer photo, or add the items manually.',
        'AI_EXTRACTION_FAILED',
        { cause: err },
      );
    }

    const items = sanitizeExtractedItems(output.items);
    logOutcome('succeeded');

    console.info(
      '[restaurantRecommendationService] menu extraction',
      JSON.stringify({
        userId,
        provider: response.provider,
        model: response.model,
        inputTokens: response.inputTokens ?? null,
        outputTokens: response.outputTokens ?? null,
        rawItemCount: output.items.length,
        itemCount: items.length,
        foreignCurrencyCount: items.filter((i) => i.foreignCurrency).length,
      }),
    );

    return {
      items: items.map((i) => ({
        name: i.name,
        price: i.price,
        description: i.description ?? null,
        foreignCurrency: i.foreignCurrency,
      })),
    };
  },

  async listMine(userId: string, query: ListRestaurantRecommendationsQuery) {
    const [rows, total] = await Promise.all([
      restaurantRecommendationRepository.listByUser(userId, {
        limit: query.limit,
        offset: query.offset,
      }),
      restaurantRecommendationRepository.countByUser(userId),
    ]);
    return {
      data: rows.map(toResponse),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  },

  /**
   * Withdraw (delete) one of the caller's own recommendations while it is
   * still pending review. Reviewed ones are immutable history — approving
   * created a restaurant and rejecting carries the admin's verdict — so they
   * can't be withdrawn.
   */
  async withdraw(userId: string, id: string): Promise<void> {
    const existing = await restaurantRecommendationRepository.findById(id);
    // Someone else's recommendation reads as 404, not 403 — don't leak existence.
    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'Recommendation not found', 'NOT_FOUND');
    }
    if (existing.status !== 'pending') {
      throw new AppError(
        409,
        'This recommendation has already been reviewed and can no longer be withdrawn.',
        'ALREADY_REVIEWED',
      );
    }
    await restaurantRecommendationRepository.deleteById(id);
  },

  async list(query: ListRestaurantRecommendationsQuery) {
    const [rows, total] = await Promise.all([
      restaurantRecommendationRepository.listForAdmin({
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      }),
      restaurantRecommendationRepository.countForAdmin(query.status),
    ]);
    return {
      data: rows.map(toAdminResponse),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  },

  async review(id: string, input: ReviewRestaurantRecommendationInput, actor: AuditActor) {
    const existing = await restaurantRecommendationRepository.findById(id);
    if (!existing) throw new AppError(404, 'Recommendation not found', 'NOT_FOUND');
    if (existing.status !== 'pending') {
      throw new AppError(409, 'This recommendation has already been reviewed', 'ALREADY_REVIEWED');
    }

    if (input.status === 'rejected') {
      const updated = await restaurantRecommendationRepository.update(id, {
        status: 'rejected',
        adminNote: input.adminNote ?? null,
        reviewedAt: new Date(),
      });
      await auditService.record({
        actor,
        action: 'restaurant-recommendation.rejected',
        entityType: 'restaurant-recommendation',
        entityId: id,
        metadata: { name: existing.name },
      });
      return toResponse(updated);
    }

    // Approved: turn it into a real (generic) restaurant + its menu items.
    if (existing.latitude == null || existing.longitude == null) {
      throw new AppError(
        400,
        "This recommendation has no saved location, so a restaurant can't be created automatically. Add the restaurant manually instead.",
        'RECOMMENDATION_NO_LOCATION',
      );
    }

    const items = dedupeItems(existing.items ?? []);
    const { restaurant, recommendation } =
      await restaurantRecommendationRepository.approveWithRestaurant(
        id,
        {
          externalId: null,
          source: 'community',
          name: existing.name,
          slug: null,
          phone: existing.phone,
          orderUrl: existing.link,
          latitude: existing.latitude,
          longitude: existing.longitude,
          deliveryFee: null,
          minimumOrder: null,
          rating: null,
          ratingCount: 0,
        },
        items.map((i) => ({
          name: i.name,
          price: String(i.price),
          description: i.description ?? null,
        })),
      );

    await auditService.record({
      actor,
      action: 'restaurant-recommendation.approved',
      entityType: 'restaurant-recommendation',
      entityId: id,
      metadata: {
        name: existing.name,
        createdRestaurantId: restaurant.id,
        itemCount: items.length,
      },
    });

    return toResponse(recommendation);
  },
};
