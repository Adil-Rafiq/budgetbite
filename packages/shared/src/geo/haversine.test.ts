import { describe, expect, it } from 'vitest';

import { haversineKm } from './haversine.js';

// Reference coordinates (central Karachi, where the scraped restaurants live).
const KARACHI = { lat: 24.8607, lng: 67.0011 };

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm(KARACHI.lat, KARACHI.lng, KARACHI.lat, KARACHI.lng)).toBe(0);
  });

  it('is symmetric', () => {
    const there = haversineKm(24.8607, 67.0011, 31.5204, 74.3587);
    const back = haversineKm(31.5204, 74.3587, 24.8607, 67.0011);
    expect(there).toBeCloseTo(back, 10);
  });

  it('measures one degree of latitude as ~111.2 km', () => {
    expect(haversineKm(0, 0, 1, 0)).toBeCloseTo(111.19, 1);
  });

  it('matches the known Karachi–Lahore great-circle distance (~1025 km)', () => {
    const km = haversineKm(24.8607, 67.0011, 31.5204, 74.3587);
    expect(km).toBeGreaterThan(1000);
    expect(km).toBeLessThan(1050);
  });

  describe('nearby-radius filtering semantics (default NEARBY_RADIUS_KM = 5)', () => {
    const RADIUS_KM = 5;

    it('keeps a restaurant ~1.1 km away', () => {
      // 0.01° of latitude ≈ 1.11 km
      const km = haversineKm(KARACHI.lat, KARACHI.lng, KARACHI.lat + 0.01, KARACHI.lng);
      expect(km).toBeLessThan(RADIUS_KM);
    });

    it('excludes a restaurant ~5.6 km away', () => {
      // 0.05° of latitude ≈ 5.56 km
      const km = haversineKm(KARACHI.lat, KARACHI.lng, KARACHI.lat + 0.05, KARACHI.lng);
      expect(km).toBeGreaterThan(RADIUS_KM);
    });

    it('accounts for longitude shrinking with latitude', () => {
      // At Karachi's latitude (~24.9°N) a degree of longitude is ~101 km,
      // noticeably less than the 111 km it spans at the equator.
      const atKarachi = haversineKm(KARACHI.lat, KARACHI.lng, KARACHI.lat, KARACHI.lng + 1);
      const atEquator = haversineKm(0, KARACHI.lng, 0, KARACHI.lng + 1);
      expect(atKarachi).toBeLessThan(atEquator);
      expect(atKarachi).toBeCloseTo(111.19 * Math.cos((KARACHI.lat * Math.PI) / 180), 0);
    });
  });
});
