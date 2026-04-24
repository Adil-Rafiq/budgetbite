import {
  orderRepository,
  mealPlanRepository,
  restaurantRepository,
  userPreferencesRepository,
  feedbackRepository,
} from '@repo/database';
import type { ProcessFeedbackInput, AIOperationResult } from '@repo/shared';
import { SYSTEM_PROMPT, buildPreferenceExtractionPrompt } from '@repo/ai/prompts';
import { llm } from '../lib/llm.js';

interface PreferenceExtractionOutput {
  updatedFeedbackSummary: string;
  newPreferredTags: string[];
  newDislikedTags: string[];
  newDietaryNotes: string[];
  dislikeRestaurant: boolean;
  priceSensitivitySignal: 'budget' | 'mid' | 'premium' | null;
}

export const preferenceService = {
  async processFeedback(
    userId: string,
    input: ProcessFeedbackInput,
  ): Promise<AIOperationResult<void>> {
    try {
      // 1. Persist raw feedback first
      await feedbackRepository.upsert({
        mealChoiceId: input.mealChoiceId,
        userId: userId,
        rating: input.rating ?? null,
        liked: input.liked ?? null,
        comment: input.comment ?? null,
      });

      // 2. Resolve choice details
      const choice = await orderRepository.findByIdWithMealType(input.mealChoiceId);
      if (!choice) return { success: false, error: 'Meal choice not found' };

      // 3. Resolve menu item name
      let menuItemName = choice.manualDescription ?? 'Unknown item';
      if (choice.suggestionId) {
        const suggestion = await mealPlanRepository.getSuggestionWithItem(choice.suggestionId);
        if (suggestion) menuItemName = suggestion.menuItemName;
      }

      // 4. Get current preference profile
      const currentPrefs = await userPreferencesRepository.findByUserId(userId);

      // 5. Extract preference signals via LLM
      const response = await llm.complete(
        [
          {
            role: 'user',
            content: buildPreferenceExtractionPrompt(currentPrefs?.feedbackSummary ?? null, {
              restaurantName: choice.restaurantName ?? 'Unknown restaurant',
              menuItemName,
              rating: input.rating,
              liked: input.liked,
              comment: input.comment,
              mealTypeLabel: choice.mealTypeLabel,
              slotDate: choice.slotDate,
            }),
          },
        ],
        { systemPrompt: SYSTEM_PROMPT, temperature: 0.2, maxTokens: 1024 },
      );

      const extracted = this.parseExtraction(response.text);

      // 6. Resolve restaurantId if user disliked the restaurant
      let dislikedRestaurantIds = currentPrefs?.dislikedRestaurantIds ?? [];
      if (extracted.dislikeRestaurant && choice.restaurantName) {
        const found = await restaurantRepository.findByName(choice.restaurantName);
        if (found && !dislikedRestaurantIds.includes(found.id)) {
          dislikedRestaurantIds = [...dislikedRestaurantIds, found.id];
        }
      }

      // 7. Merge and persist updated preferences
      const mergeUnique = (a: string[], b: string[]): string[] => [...new Set([...a, ...b])];

      await userPreferencesRepository.upsert({
        userId,
        dislikedRestaurantIds,
        preferredCuisineTags: mergeUnique(
          currentPrefs?.preferredCuisineTags ?? [],
          extracted.newPreferredTags,
        ),
        dislikedCuisineTags: mergeUnique(
          currentPrefs?.dislikedCuisineTags ?? [],
          extracted.newDislikedTags,
        ),
        dietaryNotes: mergeUnique(currentPrefs?.dietaryNotes ?? [], extracted.newDietaryNotes),
        feedbackSummary: extracted.updatedFeedbackSummary,
        priceSensitivity:
          extracted.priceSensitivitySignal ?? currentPrefs?.priceSensitivity ?? 'mid',
      });

      return {
        success: true,
        tokensUsed: (response.inputTokens ?? 0) + (response.outputTokens ?? 0),
      };
    } catch (err) {
      console.error('[preferenceService.processFeedback]', err);
      return { success: false, error: String(err) };
    }
  },

  parseExtraction(raw: string): PreferenceExtractionOutput {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    return JSON.parse(cleaned) as PreferenceExtractionOutput;
  },
};
