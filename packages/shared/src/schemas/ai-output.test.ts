import { describe, expect, it } from 'vitest';

import {
  aiMenuExtractionOutputSchema,
  aiPlanOutputSchema,
  aiSlotRerollOutputSchema,
} from './ai-output.js';

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

function makeOption(optionIndex: number) {
  return {
    optionIndex,
    restaurantId: UUID_A,
    items: [{ menuItemId: UUID_B, estimatedPrice: 450 }],
    notes: 'good value',
  };
}

function makeSlot() {
  return {
    slotDate: '2026-07-06',
    mealTypeKey: 'lunch',
    options: [makeOption(0), makeOption(1), makeOption(2)],
  };
}

function makePlanOutput() {
  return {
    slots: [makeSlot()],
    planSummary: 'One lunch suggestion.',
    estimatedTotalCost: 450,
  };
}

describe('aiPlanOutputSchema', () => {
  it('accepts a well-formed plan', () => {
    const result = aiPlanOutputSchema.safeParse(makePlanOutput());
    expect(result.success).toBe(true);
  });

  it('accepts a combo option with up to 4 items', () => {
    const output = makePlanOutput();
    output.slots[0]!.options[0]!.items = [
      { menuItemId: UUID_B, estimatedPrice: 300 },
      { menuItemId: UUID_A, estimatedPrice: 150 },
      { menuItemId: UUID_B, estimatedPrice: 90 },
      { menuItemId: UUID_A, estimatedPrice: 60 },
    ];
    expect(aiPlanOutputSchema.safeParse(output).success).toBe(true);
  });

  it('rejects a non-UUID menuItemId (hallucinated ids fail fast)', () => {
    const output = makePlanOutput();
    output.slots[0]!.options[0]!.items[0]!.menuItemId = 'menu-item-7';
    expect(aiPlanOutputSchema.safeParse(output).success).toBe(false);
  });

  it('rejects a slot that does not have exactly 3 options', () => {
    const twoOptions = makePlanOutput();
    twoOptions.slots[0]!.options = twoOptions.slots[0]!.options.slice(0, 2);
    expect(aiPlanOutputSchema.safeParse(twoOptions).success).toBe(false);

    const fourOptions = makePlanOutput();
    fourOptions.slots[0]!.options.push(makeOption(2));
    expect(aiPlanOutputSchema.safeParse(fourOptions).success).toBe(false);
  });

  it('rejects an option with zero or more than 4 items', () => {
    const empty = makePlanOutput();
    empty.slots[0]!.options[0]!.items = [];
    expect(aiPlanOutputSchema.safeParse(empty).success).toBe(false);

    const tooMany = makePlanOutput();
    tooMany.slots[0]!.options[0]!.items = Array.from({ length: 5 }, () => ({
      menuItemId: UUID_B,
      estimatedPrice: 100,
    }));
    expect(aiPlanOutputSchema.safeParse(tooMany).success).toBe(false);
  });

  it('rejects a negative estimated price', () => {
    const output = makePlanOutput();
    output.slots[0]!.options[0]!.items[0]!.estimatedPrice = -1;
    expect(aiPlanOutputSchema.safeParse(output).success).toBe(false);
  });

  it('rejects an optionIndex outside 0-2', () => {
    const output = makePlanOutput();
    output.slots[0]!.options[2]!.optionIndex = 3;
    expect(aiPlanOutputSchema.safeParse(output).success).toBe(false);
  });

  it('rejects a mealTypeKey with uppercase or whitespace', () => {
    for (const bad of ['Lunch', 'lunch ', 'mid day', '']) {
      const output = makePlanOutput();
      output.slots[0]!.mealTypeKey = bad;
      expect(aiPlanOutputSchema.safeParse(output).success).toBe(false);
    }
  });

  it('rejects a slotDate that is not YYYY-MM-DD', () => {
    const output = makePlanOutput();
    output.slots[0]!.slotDate = '06/07/2026';
    expect(aiPlanOutputSchema.safeParse(output).success).toBe(false);
  });

  it('rejects an empty slots array and an empty planSummary', () => {
    expect(aiPlanOutputSchema.safeParse({ ...makePlanOutput(), slots: [] }).success).toBe(false);
    expect(aiPlanOutputSchema.safeParse({ ...makePlanOutput(), planSummary: '' }).success).toBe(
      false,
    );
  });
});

describe('aiSlotRerollOutputSchema', () => {
  it('accepts exactly 3 fresh options', () => {
    const result = aiSlotRerollOutputSchema.safeParse({
      options: [makeOption(0), makeOption(1), makeOption(2)],
    });
    expect(result.success).toBe(true);
  });

  it('rejects any other option count', () => {
    expect(aiSlotRerollOutputSchema.safeParse({ options: [makeOption(0)] }).success).toBe(false);
    expect(
      aiSlotRerollOutputSchema.safeParse({
        options: [makeOption(0), makeOption(1), makeOption(2), makeOption(2)],
      }).success,
    ).toBe(false);
  });
});

describe('aiMenuExtractionOutputSchema', () => {
  it('coerces string prices and tolerates missing descriptions', () => {
    const result = aiMenuExtractionOutputSchema.safeParse({
      items: [
        { name: 'Zinger Burger', price: '450' },
        { name: 'Fries', price: 250, description: null },
        { name: 'Imported Soda', price: '1.99', foreignCurrency: 'USD' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0]!.price).toBe(450);
      expect(result.data.items[2]!.price).toBe(1.99);
    }
  });

  it('rejects an unparseable price', () => {
    const result = aiMenuExtractionOutputSchema.safeParse({
      items: [{ name: 'Mystery', price: 'market rate' }],
    });
    expect(result.success).toBe(false);
  });

  it('caps the item list at 100', () => {
    const items = Array.from({ length: 101 }, (_, i) => ({ name: `Item ${i}`, price: 100 }));
    expect(aiMenuExtractionOutputSchema.safeParse({ items }).success).toBe(false);
  });
});
