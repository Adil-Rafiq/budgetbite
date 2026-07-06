import { describe, expect, it } from 'vitest';

import { toNumber, toNumberOrNull } from './numeric.js';

describe('toNumber', () => {
  it('parses Drizzle numeric strings', () => {
    expect(toNumber('12.50')).toBe(12.5);
    expect(toNumber('0')).toBe(0);
    expect(toNumber('0.00')).toBe(0);
    expect(toNumber('-45.75')).toBe(-45.75);
    expect(toNumber('15000')).toBe(15000);
  });

  it('passes numbers through unchanged', () => {
    expect(toNumber(7)).toBe(7);
    expect(toNumber(0)).toBe(0);
    expect(toNumber(-3.25)).toBe(-3.25);
  });

  it('keeps full precision on high-scale numeric strings', () => {
    expect(toNumber('1234.5678')).toBe(1234.5678);
  });

  it('yields NaN for a non-numeric string (garbage never silently becomes 0)', () => {
    expect(toNumber('not-a-number')).toBeNaN();
  });
});

describe('toNumberOrNull', () => {
  it('maps null and undefined to null', () => {
    expect(toNumberOrNull(null)).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
  });

  it('converts strings and passes numbers through', () => {
    expect(toNumberOrNull('4.20')).toBe(4.2);
    expect(toNumberOrNull(9)).toBe(9);
  });

  it('treats zero as a value, not as missing', () => {
    expect(toNumberOrNull('0')).toBe(0);
    expect(toNumberOrNull(0)).toBe(0);
  });
});
