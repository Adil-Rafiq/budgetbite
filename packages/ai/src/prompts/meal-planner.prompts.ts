import type { MealPlannerContext, NearbyRestaurantContext } from '@repo/shared';

/**
 * All system and user prompts live here.
 */

export const SYSTEM_PROMPT = `You are BudgetBite AI, a meal planning assistant.
Your job is to suggest meals from real restaurants that fit within a user's budget.
You always respond with valid JSON only. No prose, no markdown, no code fences.
You consider the user's taste preferences, disliked restaurants, dietary notes, and price sensitivity.
You always suggest exactly 3 options per meal slot, ordered from most recommended to least.
Each option is ONE order placed at a single restaurant and may combine 1-3 menu items
(e.g. burger + wings + drink for one lunch) so it reflects how a real order is composed.
Budget adherence is critical — the user's financial wellbeing depends on staying within budget.

ID handling rules (critical):
- restaurantId and menuItemId values are UUIDs supplied to you in the user message.
- You may ONLY use UUIDs that appear verbatim in the provided "Available Restaurants" data.
- Never invent, guess, abbreviate, or modify any UUID.
- Every menuItemId in an option must belong to that option's restaurantId — never mix items across restaurants in one order.
- If you would otherwise need an ID you weren't given, pick a different real option from the data instead.`;

/**
 * Compact id catalogue: one line per (restaurant, menu item) pair. Repeating
 * the IDs in this flat form (in addition to the structured JSON below) makes
 * it harder for the model to drift to a hallucinated UUID — copying is easier
 * than inventing.
 */
function buildIdCatalogue(restaurants: NearbyRestaurantContext[]): string {
  const lines: string[] = [];
  for (const r of restaurants) {
    lines.push(`Restaurant ${r.restaurantId} — ${r.name}`);
    for (const item of r.menuItems) {
      lines.push(`  Item ${item.menuItemId} — ${item.name} (PKR ${item.price})`);
    }
  }
  return lines.join('\n');
}

/**
 * Render a "do not regenerate these slots" section. Pinned (date, mealType)
 * pairs are user-locked overrides served by the read path directly from the
 * meal_pin table; the LLM's role is to fill the remaining slots around them.
 * Budget math passed to the prompt is already pre-adjusted for pin spend, so
 * the model just needs to skip these cells.
 */
function buildPinnedSlotsSection(
  pinnedSlots: { slotDate: string; mealTypeId: string }[],
  mealTypes: { id: string; key: string; label: string; sortOrder: number }[],
): string {
  if (pinnedSlots.length === 0) return 'None — generate for every (date, mealType) pair.';
  const idToKey = new Map(mealTypes.map((m) => [m.id, m.key] as const));
  const lines = pinnedSlots
    .map((p) => `- ${p.slotDate} / ${idToKey.get(p.mealTypeId) ?? p.mealTypeId}`)
    .sort();
  return lines.join('\n');
}

// ─── Prompt: Initial full plan generation ─────────────────────────────────────

export function buildGeneratePlanPrompt(ctx: MealPlannerContext): string {
  const mealTypeKeys = ctx.plan.mealTypes.map((m) => `"${m.key}"`).join(' | ');
  const mealTypeLabels = ctx.plan.mealTypes.map((m) => m.label).join(', ');
  return `Generate a complete meal plan for the following budget plan.

## Budget (already pre-adjusted for any pinned slots)
- Total budget: PKR ${ctx.budget.totalBudget}
- Plan period: ${ctx.plan.startDate} to ${ctx.plan.endDate} (${ctx.plan.planType})
- Meals per day: ${mealTypeLabels}
- Average budget per meal: PKR ${ctx.budget.avgBudgetPerRemainingMeal.toFixed(2)}
- Pinned slots count: ${ctx.pinnedSlots.length}

## Slots already user-locked (DO NOT regenerate these)
${buildPinnedSlotsSection(ctx.pinnedSlots, ctx.plan.mealTypes)}

## User Preferences
- Price sensitivity: ${ctx.preferences.priceSensitivity}
- Preferred tags: ${ctx.preferences.preferredCuisineTags.join(', ') || 'none specified'}
- Disliked tags: ${ctx.preferences.dislikedCuisineTags.join(', ') || 'none'}
- Dietary notes: ${ctx.preferences.dietaryNotes.join(', ') || 'none'}
- Feedback history: ${ctx.preferences.feedbackSummary ?? 'No feedback yet'}

## Available Restaurants (nearby, preferences already filtered)
${JSON.stringify(ctx.restaurants, null, 2)}

## ID catalogue (the ONLY UUIDs you may use — copy exactly)
${buildIdCatalogue(ctx.restaurants)}

## Days to plan
${ctx.remainingDates.join(', ')}

## Meal type keys (use EXACTLY as shown, lowercase, no modifications)
${ctx.plan.mealTypes.map((m) => `- "${m.key}" → ${m.label}`).join('\n')}

## Required JSON output format
{
  "slots": [
    {
      "slotDate": "YYYY-MM-DD",
      "mealTypeKey": ${mealTypeKeys},
      "options": [
        {
          "optionIndex": 0,
          "restaurantId": "<uuid from available restaurants>",
          "items": [
            {
              "menuItemId": "<uuid from available restaurants>",
              "estimatedPrice": <number>
            }
          ],
          "notes": "<short reason why this fits>"
        }
      ]
    }
  ],
  "planSummary": "<2-3 sentence summary of the plan strategy>",
  "estimatedTotalCost": <number>
}

Rules:
- Each slot must have exactly 3 options (optionIndex 0, 1, 2)
- optionIndex 0 = most recommended, 1 = second choice, 2 = third choice
- Each option is ONE order at a single restaurant with 1-3 items — compose a realistic order (e.g. a main plus a side or drink) when the budget allows; a single item is fine for tight budgets
- Every menuItemId in an option must belong to that option's restaurantId in the catalogue — never mix restaurants inside one order
- The option's cost is the sum of its items' estimatedPrice values — keep that sum within the per-meal budget
- mealTypeKey must be EXACTLY as listed in the meal type keys section above — lowercase, no capitalization
- estimatedPrice must be realistic based on the menu item price
- Never use a restaurantId or menuItemId not present in the ID catalogue above
- Never invent, modify, or guess UUIDs — copy them character-for-character from the catalogue
- Distribute variety across the plan — avoid repeating the same restaurant for consecutive meals
- Keep the total estimated cost within the total budget
- Keep \`notes\` short (≤ 120 chars) so the response fits within the token budget`;
}

// ─── Prompt: Re-plan after a meal choice ──────────────────────────────────────

export function buildReplanPrompt(ctx: MealPlannerContext, triggerSummary: string): string {
  const mealTypeKeys = ctx.plan.mealTypes.map((m) => `"${m.key}"`).join(' | ');
  const variance = Number(ctx.budget.cumulativeVariance);
  return `A user has confirmed a meal that requires rebalancing their remaining plan.

## What happened
${triggerSummary}

## Current Budget State (pre-adjusted for any pinned slots)
- Total budget: PKR ${ctx.budget.totalBudget}
- Amount spent so far: PKR ${ctx.budget.amountSpent}
- Amount remaining: PKR ${ctx.budget.amountRemaining}
- Meals consumed: ${ctx.budget.mealsConsumed} / ${ctx.budget.totalMeals}
- Meals remaining: ${ctx.budget.mealsRemaining}
- Average budget per remaining meal: PKR ${ctx.budget.avgBudgetPerRemainingMeal.toFixed(2)}
- Cumulative variance: PKR ${ctx.budget.cumulativeVariance} (${variance >= 0 ? 'underspent — slight headroom available' : 'overspent — compensate with cheaper options'})
- Pinned slots count: ${ctx.pinnedSlots.length}

## Slots already user-locked (DO NOT regenerate these)
${buildPinnedSlotsSection(ctx.pinnedSlots, ctx.plan.mealTypes)}

## User Preferences
- Price sensitivity: ${ctx.preferences.priceSensitivity}
- Preferred tags: ${ctx.preferences.preferredCuisineTags.join(', ') || 'none'}
- Disliked tags: ${ctx.preferences.dislikedCuisineTags.join(', ') || 'none'}
- Dietary notes: ${ctx.preferences.dietaryNotes.join(', ') || 'none'}
- Feedback history: ${ctx.preferences.feedbackSummary ?? 'No feedback yet'}

## Available Restaurants (nearby, preferences already filtered)
${JSON.stringify(ctx.restaurants, null, 2)}

## ID catalogue (the ONLY UUIDs you may use — copy exactly)
${buildIdCatalogue(ctx.restaurants)}

## Remaining dates and meal slots to fill
${ctx.remainingDates.join(', ')}

## Meal type keys (use EXACTLY as shown, lowercase, no modifications)
${ctx.plan.mealTypes.map((m) => `- "${m.key}" → ${m.label}`).join('\n')}

## Required JSON output format
{
  "slots": [
    {
      "slotDate": "YYYY-MM-DD",
      "mealTypeKey": ${mealTypeKeys},
      "options": [
        {
          "optionIndex": 0,
          "restaurantId": "<uuid from available restaurants>",
          "items": [
            {
              "menuItemId": "<uuid from available restaurants>",
              "estimatedPrice": <number>
            }
          ],
          "notes": "<short reason why this fits>"
        }
      ]
    }
  ],
  "planSummary": "<2-3 sentence summary of the rebalancing strategy>",
  "estimatedTotalCost": <number>
}

Rules:
- Regenerate ONLY the remaining slots listed above — do not include already consumed meals
- Each slot must have exactly 3 options (optionIndex 0, 1, 2)
- optionIndex 0 = most recommended, 1 = second choice, 2 = third choice
- Each option is ONE order at a single restaurant with 1-3 items — compose a realistic order (e.g. a main plus a side or drink) when the budget allows; a single item is fine for tight budgets
- Every menuItemId in an option must belong to that option's restaurantId in the catalogue — never mix restaurants inside one order
- The option's cost is the sum of its items' estimatedPrice values — keep that sum within the per-meal budget
- mealTypeKey must be EXACTLY as listed in the meal type keys section above — lowercase, no capitalisation
- Never use a restaurantId or menuItemId not present in the ID catalogue above
- Never invent, modify, or guess UUIDs — copy them character-for-character from the catalogue
- estimatedTotalCost refers to the remaining meals only, not the full plan
- Distribute variety — avoid repeating the same restaurant for consecutive meals
- Keep the remaining estimated cost within the remaining budget of PKR ${ctx.budget.amountRemaining}
- Keep \`notes\` short (≤ 120 chars) so the response fits within the token budget`;
}

// ─── Prompt: Preference extraction from feedback ───────────────────────────────

export function buildPreferenceExtractionPrompt(
  currentSummary: string | null,
  feedbackEntry: {
    restaurantName: string;
    menuItemName: string;
    rating: number | null;
    liked: boolean | null;
    comment: string | null;
    mealTypeLabel: string;
    slotDate: string;
  },
): string {
  return `You are updating a user's preference profile based on their latest meal feedback.

## Current preference summary
${currentSummary ?? 'No previous feedback.'}

## New feedback entry
- Date: ${feedbackEntry.slotDate}
- Meal: ${feedbackEntry.mealTypeLabel}
- Restaurant: ${feedbackEntry.restaurantName}
- Item: ${feedbackEntry.menuItemName}
- Rating: ${feedbackEntry.rating ?? 'not given'}/5
- Liked: ${feedbackEntry.liked ?? 'not specified'}
- Comment: "${feedbackEntry.comment ?? ''}"

## Your task
Extract any new preference signals from this feedback and return an updated JSON object.

Required JSON output format:
{
  "updatedFeedbackSummary": "<updated rolling summary, max 300 words, drop oldest detail if needed>",
  "newPreferredTags": ["<cuisine or food tag to ADD to preferred list>"],
  "newDislikedTags": ["<cuisine or food tag to ADD to disliked list>"],
  "newDietaryNotes": ["<dietary note to ADD if expressed>"],
  "dislikeRestaurant": true | false,
  "priceSensitivitySignal": "budget" | "mid" | "premium" | null
}

Rules:
- Only return tags/notes if clearly signalled in the feedback. Empty arrays are fine.
- dislikeRestaurant = true only if the user clearly expressed dislike for the restaurant (not just one item)
- priceSensitivitySignal = null if no price signal in this feedback
- Keep updatedFeedbackSummary concise and in third-person ("User prefers...", "User dislikes...")`;
}
