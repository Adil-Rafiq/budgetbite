import { describe, expect, it } from 'vitest';

import { dietaryTagListSchema, updateUserProfileSchema } from './user.js';

describe('dietaryTagListSchema', () => {
  it('trims, lowercases, and drops empty entries', () => {
    const result = dietaryTagListSchema.parse(['  Halal ', 'NO BEEF', '   ', '']);
    expect(result).toEqual(['halal', 'no beef']);
  });

  it('de-duplicates case-insensitively', () => {
    const result = dietaryTagListSchema.parse(['peanuts', 'Peanuts', 'PEANUTS ', 'soy']);
    expect(result).toEqual(['peanuts', 'soy']);
  });

  it('rejects more than 20 tags', () => {
    const result = dietaryTagListSchema.safeParse(Array.from({ length: 21 }, (_, i) => `tag-${i}`));
    expect(result.success).toBe(false);
  });

  it('rejects tags longer than 60 characters', () => {
    const result = dietaryTagListSchema.safeParse(['a'.repeat(61)]);
    expect(result.success).toBe(false);
  });
});

describe('updateUserProfileSchema', () => {
  it('accepts a location-only update without dietary fields', () => {
    const result = updateUserProfileSchema.parse({ latitude: 24.8607, longitude: 67.0011 });
    expect(result.dietaryPreferences).toBeUndefined();
    expect(result.allergens).toBeUndefined();
  });

  it('normalizes dietary fields when present', () => {
    const result = updateUserProfileSchema.parse({
      dietaryPreferences: [' Vegetarian '],
      allergens: ['Shellfish', 'shellfish'],
    });
    expect(result.dietaryPreferences).toEqual(['vegetarian']);
    expect(result.allergens).toEqual(['shellfish']);
  });

  it('accepts empty arrays (clearing all tags)', () => {
    const result = updateUserProfileSchema.parse({ dietaryPreferences: [], allergens: [] });
    expect(result.dietaryPreferences).toEqual([]);
    expect(result.allergens).toEqual([]);
  });
});
