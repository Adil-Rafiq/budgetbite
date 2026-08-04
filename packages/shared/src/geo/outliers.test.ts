import { describe, expect, it } from 'vitest';

import { densityStep, flagOutliers, isNullIsland, medianCenter } from './outliers.js';

// The two cities the haversine suite already fixes at ~1025 km apart.
const KARACHI = { latitude: 24.8607, longitude: 67.0011 };
const LAHORE = { latitude: 31.5204, longitude: 74.3587 };
const NULL_ISLAND = { latitude: 0, longitude: 0 };

/** A tight cluster around a centre, the shape a real catalogue has. */
const cluster = (center: { latitude: number; longitude: number }, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    latitude: center.latitude + i * 0.002,
    longitude: center.longitude + i * 0.002,
  }));

describe('medianCenter', () => {
  it('returns null for an empty set rather than (0, 0)', () => {
    // (0, 0) is the value this module treats as a defect. Handing it back as a
    // "centre" would make every real point an outlier from it.
    expect(medianCenter([])).toBeNull();
  });

  it('returns the point itself for a single point', () => {
    expect(medianCenter([KARACHI])).toEqual(KARACHI);
  });

  it('takes the middle value for an odd count', () => {
    const center = medianCenter([
      { latitude: 10, longitude: 10 },
      { latitude: 30, longitude: 30 },
      { latitude: 20, longitude: 20 },
    ]);
    expect(center).toEqual({ latitude: 20, longitude: 20 });
  });

  it('averages the two middle values for an even count', () => {
    const center = medianCenter([
      { latitude: 10, longitude: 10 },
      { latitude: 20, longitude: 30 },
      { latitude: 30, longitude: 50 },
      { latitude: 40, longitude: 70 },
    ]);
    expect(center).toEqual({ latitude: 25, longitude: 40 });
  });

  it('barely moves when one wild point is added — the reason it is not a mean', () => {
    const good = cluster(KARACHI, 9);
    const withWildPoint = [...good, { latitude: 80, longitude: -170 }];

    const before = medianCenter(good);
    const after = medianCenter(withWildPoint);

    expect(after?.latitude).toBeCloseTo(before?.latitude as number, 2);
    expect(after?.longitude).toBeCloseTo(before?.longitude as number, 2);

    // The mean, for contrast, is dragged clean off the map.
    const meanLat = withWildPoint.reduce((s, p) => s + p.latitude, 0) / withWildPoint.length;
    expect(Math.abs(meanLat - KARACHI.latitude)).toBeGreaterThan(4);
  });
});

describe('isNullIsland', () => {
  it('matches exact zeroes', () => {
    expect(isNullIsland(NULL_ISLAND)).toBe(true);
  });

  it('tolerates float dust', () => {
    expect(isNullIsland({ latitude: 1e-12, longitude: -1e-12 })).toBe(true);
  });

  it('does not match a real coordinate', () => {
    expect(isNullIsland(KARACHI)).toBe(false);
    // Deliberately near-zero but real: the Gulf of Guinea is water, but 0.5° is
    // 55 km from the origin and nothing about it says "unparsed".
    expect(isNullIsland({ latitude: 0.5, longitude: 0.5 })).toBe(false);
  });
});

describe('flagOutliers', () => {
  it('preserves input order and length', () => {
    const points = [...cluster(KARACHI, 3), LAHORE];
    const flagged = flagOutliers(points);
    expect(flagged).toHaveLength(4);
    expect(flagged.map((p) => p.latitude)).toEqual(points.map((p) => p.latitude));
  });

  it('carries the original fields through', () => {
    const [flagged] = flagOutliers([{ ...KARACHI, id: 'abc', name: 'Student Biryani' }]);
    expect(flagged).toMatchObject({ id: 'abc', name: 'Student Biryani', isOutlier: false });
  });

  it('flags (0, 0)', () => {
    const flagged = flagOutliers([...cluster(KARACHI, 5), NULL_ISLAND]);
    expect(flagged.at(-1)?.isOutlier).toBe(true);
    expect(flagged.slice(0, 5).every((p) => !p.isOutlier)).toBe(true);
  });

  it('flags (0, 0) even when null island is the majority', () => {
    // The degenerate case a purely statistical rule gets wrong: with 5 broken
    // rows and 1 good one the median IS (0, 0), so every distance from it is
    // either zero or "the good row is the anomaly".
    const flagged = flagOutliers([
      NULL_ISLAND,
      NULL_ISLAND,
      NULL_ISLAND,
      NULL_ISLAND,
      NULL_ISLAND,
      KARACHI,
    ]);
    expect(flagged.slice(0, 5).every((p) => p.isOutlier)).toBe(true);
    expect(flagged.at(-1)?.isOutlier).toBe(false);
  });

  it('flags a restaurant in the wrong city', () => {
    const flagged = flagOutliers([...cluster(LAHORE, 8), KARACHI]);
    expect(flagged.at(-1)?.isOutlier).toBe(true);
  });

  it('does not flag anything in a tight cluster', () => {
    expect(flagOutliers(cluster(KARACHI, 20)).some((p) => p.isOutlier)).toBe(false);
  });

  it('respects a custom threshold', () => {
    const points = [...cluster(LAHORE, 5), KARACHI];
    // ~1025 km apart: inside a 2000 km threshold, outside a 100 km one.
    expect(flagOutliers(points, { thresholdKm: 2000 }).at(-1)?.isOutlier).toBe(false);
    expect(flagOutliers(points, { thresholdKm: 100 }).at(-1)?.isOutlier).toBe(true);
  });

  it('never flags a lone real point — one restaurant cannot be far from itself', () => {
    expect(flagOutliers([KARACHI]).at(0)?.isOutlier).toBe(false);
  });

  it('still flags a lone (0, 0)', () => {
    expect(flagOutliers([NULL_ISLAND]).at(0)?.isOutlier).toBe(true);
  });

  it('returns an empty array for empty input', () => {
    expect(flagOutliers([])).toEqual([]);
  });
});

describe('densityStep', () => {
  it('puts the busiest cell in the darkest step', () => {
    expect(densityStep(40, 40, 5)).toBe(4);
  });

  it('keeps any non-zero count out of nothing — the palest step still reads', () => {
    expect(densityStep(1, 100, 5)).toBe(0);
    expect(densityStep(0, 100, 5)).toBe(0);
  });

  it('spreads across the range of the data actually on screen', () => {
    // Busiest cell of 9, not thousands: the ramp still uses every step.
    const steps = [1, 3, 5, 7, 9].map((c) => densityStep(c, 9, 5));
    expect(new Set(steps).size).toBeGreaterThan(3);
    expect(Math.max(...steps)).toBe(4);
  });

  it('is monotonic', () => {
    let previous = -1;
    for (let count = 0; count <= 50; count++) {
      const step = densityStep(count, 50, 5);
      expect(step).toBeGreaterThanOrEqual(previous);
      previous = step;
    }
  });

  it('clamps a count above max instead of running off the ramp', () => {
    expect(densityStep(500, 40, 5)).toBe(4);
  });

  it('collapses to step 0 for a degenerate ramp', () => {
    expect(densityStep(5, 0, 5)).toBe(0);
    expect(densityStep(5, 10, 1)).toBe(0);
  });
});
